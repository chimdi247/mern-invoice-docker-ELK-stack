import { context as otelContext, metrics } from "@opentelemetry/api";
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { systemLogs } from "../utils/Logger.js";

const LATENCY_BUCKETS_S = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

const httpMeter = metrics.getMeter("invoice.http");

// Prometheus names (Collector -> Mimir):
//   app_http_requests_total{method,route,status_code}
//   app_http_request_duration_seconds_bucket{method,route,status_code,le}
const httpRequests = httpMeter.createCounter("app.http.requests", {
	description: "HTTP requests handled, by method / route template / status",
});
const httpDuration = httpMeter.createHistogram("app.http.request.duration", {
	unit: "s",
	description: "HTTP server request duration",
	advice: { explicitBucketBoundaries: LATENCY_BUCKETS_S },
});

// app_uptime_seconds, invoice_mongodb_connected
httpMeter
	.createObservableGauge("app.uptime", { unit: "s", description: "Seconds since the process started" })
	.addCallback((result) => result.observe(process.uptime()));
httpMeter
	.createObservableGauge("invoice.mongodb.connected", {
		description: "1 when the mongoose connection is open",
	})
	.addCallback((result) => result.observe(mongoose.connection.readyState === 1 ? 1 : 0));

/**
 * RED metrics + one structured access-log line per request.
 *  - `route` is the matched route TEMPLATE (/api/v1/document/:id), never the raw URL -> bounded cardinality
 *  - the histogram is recorded inside the request's trace context, so Mimir keeps an exemplar (trace_id)
 */
export function httpObservability() {
	return (req: Request, res: Response, next: NextFunction) => {
		const start = process.hrtime.bigint();
		const ctx = otelContext.active();

		res.on("finish", () => {
			const seconds = Number(process.hrtime.bigint() - start) / 1e9;
			const route = req.route?.path ? `${req.baseUrl ?? ""}${req.route.path as string}` : "unmatched";
			const attributes = { method: req.method, route, status_code: String(res.statusCode) };

			otelContext.with(ctx, () => {
				httpRequests.add(1, attributes);
				httpDuration.record(seconds, attributes);

				const meta = {
					method: req.method,
					route,
					path: req.originalUrl.split("?")[0], // never log query strings (tokens)
					status_code: res.statusCode,
					duration_ms: Math.round(seconds * 1000),
					content_length: Number(res.getHeader("content-length") ?? 0),
				};
				if (res.statusCode >= 500) systemLogs.error("http_request", meta);
				else if (res.statusCode >= 400) systemLogs.warn("http_request", meta);
				else systemLogs.http("http_request", meta);
			});
		});

		next();
	};
}

// ----------------------------------------------------------------------------------------------
// Business KPIs. Never put unbounded values (ids, emails) in attributes - they become labels.
// ----------------------------------------------------------------------------------------------
const bizMeter = metrics.getMeter("invoice.business");

export const bizMetrics = {
	// invoice_users_registered_total
	usersRegistered: bizMeter.createCounter("invoice.users.registered", { description: "Accounts created" }),
	// invoice_user_logins_total{outcome="success|failure"}
	userLogins: bizMeter.createCounter("invoice.user.logins", { description: "Login attempts by outcome" }),
	// invoice_email_verifications_total
	emailsVerified: bizMeter.createCounter("invoice.email.verifications", { description: "Accounts verified by e-mail" }),
	// invoice_password_resets_total{stage="requested|completed"}
	passwordResets: bizMeter.createCounter("invoice.password.resets", { description: "Password reset flow events" }),
	// invoice_customers_created_total
	customersCreated: bizMeter.createCounter("invoice.customers.created", { description: "Customers created" }),
	// invoice_documents_created_total{type="Invoice|Receipt|Quotation"}
	documentsCreated: bizMeter.createCounter("invoice.documents.created", { description: "Documents created by type" }),
	// invoice_document_value_total{type,currency}  (sum of document totals, major currency units)
	documentValue: bizMeter.createCounter("invoice.document.value", { description: "Sum of created document totals" }),
	// invoice_payments_recorded_total{method}, invoice_payments_amount_total{currency}
	paymentsRecorded: bizMeter.createCounter("invoice.payments.recorded", { description: "Payments recorded by method" }),
	paymentsAmount: bizMeter.createCounter("invoice.payments.amount", { description: "Sum of recorded payments" }),
	// invoice_pdfs_generated_total{outcome}, invoice_pdf_generation_duration_seconds_bucket
	pdfsGenerated: bizMeter.createCounter("invoice.pdfs.generated", { description: "PDF renders by outcome" }),
	pdfDuration: bizMeter.createHistogram("invoice.pdf.generation.duration", {
		unit: "s",
		advice: { explicitBucketBoundaries: [0.1, 0.25, 0.5, 1, 2, 5, 10, 30] },
	}),
	// invoice_emails_sent_total{template,outcome}
	emailsSent: bizMeter.createCounter("invoice.emails.sent", { description: "Outgoing e-mails by template and outcome" }),
};

import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { renderPdf } from "../../helpers/pdfRenderer.js";
import { sendMail } from "../../helpers/emailTransport.js";
import { bizMetrics } from "../../observability/metrics.js";
import { escapeHtmlDeep } from "../../utils/escapeHtml.js";
import { systemLogs } from "../../utils/Logger.js";
import emailTemplate from "../../utils/pdf/emailTemplate.js";
import pdfTemplate from "../../utils/pdf/pdfTemplate.js";
import type { PdfPayload } from "../../utils/pdf/types.js";

const parsePayload = (req: Request, res: Response): PdfPayload => {
	const body = req.body as Partial<PdfPayload>;
	if (!body?.document || !body?.profile) {
		res.status(400);
		throw new Error("A document and a profile are required");
	}
	// the templates interpolate raw strings -> escape everything the client sent
	return escapeHtmlDeep({ ...body, totalAmountReceived: Number(body.totalAmountReceived) || 0 } as PdfPayload);
};

// $-title   Generate a document PDF
// $-path    POST /api/v1/document/generate-pdf
// $-auth    Private
// Streams the PDF back (the old version wrote one shared file on disk, racing between users).
export const generatePDF = async (req: Request, res: Response) => {
	const payload = parsePayload(req, res);
	const pdf = await renderPdf(pdfTemplate(payload));

	res.set({
		"Content-Type": "application/pdf",
		"Content-Disposition": `attachment; filename="${payload.document.documentNumber || "document"}.pdf"`,
		"Content-Length": String(pdf.length),
	});
	res.send(pdf);
};

// $-title   Send the document as e-mail with the PDF attached
// $-path    POST /api/v1/document/send-pdf
// $-auth    Private
export const sendDocument = async (req: Request, res: Response) => {
	const payload = parsePayload(req, res);
	const { profile, document } = payload;

	const pdf = await renderPdf(pdfTemplate(payload));
	const sender = profile.businessName ? profile.businessName : profile.firstName;

	try {
		await sendMail({
			from: env.senderEmail,
			to: document.customer.email,
			replyTo: profile.email,
			subject: `Document from ${sender}`,
			text: `Document from ${sender}`,
			html: emailTemplate(payload),
			attachments: [{ filename: `${document.documentNumber || "document"}.pdf`, content: pdf }],
		});
		bizMetrics.emailsSent.add(1, { template: "document-pdf", outcome: "success" });
	} catch (error) {
		bizMetrics.emailsSent.add(1, { template: "document-pdf", outcome: "failure" });
		systemLogs.error("document_email_failed", { message: (error as Error).message });
		res.status(502);
		throw new Error("The document could not be e-mailed. Check the SMTP configuration");
	}

	res.json({ success: true, message: "Document sent" });
};

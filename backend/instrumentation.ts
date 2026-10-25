/**
 * OpenTelemetry bootstrap. Loaded BEFORE the application with node's --require flag:
 *
 *   node --require ./dist/instrumentation.js dist/server.js
 *
 * Instrumentations patch modules (http, express, mongodb, mongoose ...) when they are first
 * required, so the SDK has to start before any application code runs. This file therefore imports
 * OpenTelemetry packages only - never application modules.
 *
 * Signals -> OpenTelemetry Collector (OTLP/HTTP) -> Mimir (metrics). Structured logs are written to
 * stdout and shipped by Fluent Bit to Elasticsearch (see observability/fluent-bit); they carry the
 * trace_id / span_id of the active span so they correlate with traces and metrics exemplars.
 * Configuration comes from the standard OTEL_* environment variables (see docker-compose.yml).
 */
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";

if (process.env.OTEL_SDK_DISABLED !== "true") {
	if (process.env.OTEL_LOG_LEVEL === "debug") {
		diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
	}

	const sdk = new NodeSDK({
		resource: resourceFromAttributes({
			"service.name": process.env.OTEL_SERVICE_NAME ?? "invoice-api",
			"service.version": process.env.APP_VERSION ?? "1.0.0",
			"deployment.environment": process.env.NODE_ENV ?? "development",
		}),
		traceExporter: new OTLPTraceExporter(),
		metricReader: new PeriodicExportingMetricReader({
			exporter: new OTLPMetricExporter(),
			exportIntervalMillis: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL ?? 15000),
		}),
		instrumentations: [
			getNodeAutoInstrumentations({
				"@opentelemetry/instrumentation-fs": { enabled: false },
				"@opentelemetry/instrumentation-dns": { enabled: false },
				"@opentelemetry/instrumentation-net": { enabled: false },
				// trace ids are added to log records by our own winston format (utils/Logger.ts)
				"@opentelemetry/instrumentation-winston": { enabled: false },
				"@opentelemetry/instrumentation-http": {
					// health probes (docker healthcheck / blackbox exporter) would drown real traffic
					ignoreIncomingRequestHook: (req) => (req.url ?? "").startsWith("/health"),
				},
				// one span per express middleware layer is very chatty; keep request handlers
				"@opentelemetry/instrumentation-express": {
					ignoreLayersType: ["middleware", "router"] as never,
				},
				"@opentelemetry/instrumentation-mongodb": {},
				"@opentelemetry/instrumentation-mongoose": {},
			}),
		],
	});

	sdk.start();

	let shuttingDown = false;
	const shutdown = () => {
		if (shuttingDown) return;
		shuttingDown = true;
		sdk.shutdown().finally(() => process.exit(0));
	};
	process.once("SIGTERM", shutdown);
	process.once("SIGINT", shutdown);
}

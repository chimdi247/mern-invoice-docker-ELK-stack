import { context, trace } from "@opentelemetry/api";
import { createLogger, format, transports } from "winston";
import { env } from "../config/env.js";

/**
 * Structured JSON logs on stdout (12-factor). In docker compose the container's log driver ships
 * them to Fluent Bit -> Elasticsearch -> Kibana. Every record carries the active OpenTelemetry
 * trace_id / span_id so a log line can be tied to the request (and its trace) that produced it.
 */
const traceContext = format((info) => {
	const spanContext = trace.getSpanContext(context.active());
	if (spanContext) {
		info.trace_id = spanContext.traceId;
		info.span_id = spanContext.spanId;
	}
	return info;
});

export const systemLogs = createLogger({
	level: env.logLevel,
	defaultMeta: { service: env.serviceName, environment: env.nodeEnv },
	format: format.combine(
		format.timestamp(), // ISO-8601, UTC
		format.errors({ stack: true }),
		traceContext(),
		format.json()
	),
	transports: [new transports.Console()],
	exceptionHandlers: [new transports.Console()],
	rejectionHandlers: [new transports.Console()],
});

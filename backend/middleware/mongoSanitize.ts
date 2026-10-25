import type { RequestHandler } from "express";

/**
 * NoSQL-injection guard: strips keys that start with "$" or contain "." from body / params / query.
 * (express-mongo-sanitize is not compatible with Express 5, where req.query is a read-only getter.)
 */
const isDangerous = (key: string) => key.startsWith("$") || key.includes(".");

export function sanitize<T>(value: T): T {
	if (Array.isArray(value)) return value.map((v) => sanitize(v)) as T;
	if (value && typeof value === "object" && !(value instanceof Date)) {
		const clean: Record<string, unknown> = {};
		for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
			if (!isDangerous(key)) clean[key] = sanitize(v);
		}
		return clean as T;
	}
	return value;
}

const mongoSanitize = (): RequestHandler => (req, _res, next) => {
	if (req.body) req.body = sanitize(req.body);
	if (req.params) req.params = sanitize(req.params);
	// req.query is a getter on the prototype in Express 5 -> shadow it with a sanitized own property
	Object.defineProperty(req, "query", {
		value: sanitize(req.query),
		writable: true,
		configurable: true,
		enumerable: true,
	});
	next();
};

export default mongoSanitize;

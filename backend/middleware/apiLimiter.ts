import rateLimit from "express-rate-limit";
import { systemLogs } from "../utils/Logger.js";

// Limits are env-tunable so load tests (tests/) can lift them without code changes.
const num = (value: string | undefined, fallback: number) => (value ? Number(value) : fallback);

const limiter = (windowMs: number, max: number, message: string) =>
	rateLimit({
		windowMs,
		limit: max,
		message: { message },
		handler: (req, res, _next, options) => {
			systemLogs.warn("rate_limited", { method: req.method, path: req.originalUrl.split("?")[0] });
			res.status(options.statusCode).send(options.message);
		},
		standardHeaders: true,
		legacyHeaders: false,
	});

export const apiLimiter = limiter(
	15 * 60 * 1000,
	num(process.env.RATE_LIMIT_API_MAX, 100),
	"Too many requests from this IP address, please try again after 15 minutes"
);

export const loginLimiter = limiter(
	30 * 60 * 1000,
	num(process.env.RATE_LIMIT_LOGIN_MAX, 20),
	"Too many login attempts from this IP address, please try again after 30 minutes"
);

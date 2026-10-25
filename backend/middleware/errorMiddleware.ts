import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { systemLogs } from "../utils/Logger.js";

/**
 * Controllers signal expected failures with `res.status(4xx); throw new Error(msg)` (or by setting
 * `error.statusCode`). Anything that is still a 2xx/3xx when an error arrives is unexpected -> 500.
 * Mongoose validation / cast errors are the caller's fault -> 400.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	let statusCode = (err as { statusCode?: number }).statusCode ?? res.statusCode;

	if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
		statusCode = 400;
	} else if ((err as { code?: number }).code === 11000) {
		statusCode = 409; // duplicate key
	} else if (!statusCode || statusCode < 400) {
		statusCode = 500;
	}

	if (statusCode >= 500) {
		systemLogs.error("unhandled_error", {
			message: err.message,
			stack: err.stack,
			method: req.method,
			path: req.originalUrl.split("?")[0],
		});
	}

	if (res.headersSent) return;

	res.status(statusCode).json({
		success: false,
		message: statusCode >= 500 && env.isProduction ? "Internal server error" : err.message,
		statusCode,
		stack: env.isProduction ? null : err.stack,
	});
};

export const notFound: RequestHandler = (req, res, next) => {
	res.status(404);
	next(new Error(`That route does not exist - ${req.originalUrl}`));
};

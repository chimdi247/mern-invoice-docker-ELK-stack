import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import googleAuth from "./config/passportSetup.js";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/apiLimiter.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import mongoSanitize from "./middleware/mongoSanitize.js";
import { httpObservability } from "./observability/metrics.js";
import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoutes from "./routes/userRoutes.js";

/** Builds the express app (no listening, no DB connection) so it can be tested with supertest. */
export function createApp() {
	const app = express();

	app.disable("x-powered-by");
	app.set("trust proxy", 1); // behind nginx: real client IP for rate limiting / logs

	// Liveness + dependency check. Used by the docker healthcheck and the uptime (blackbox) probe.
	// Registered first: no auth, no rate limit, not traced, not counted in the HTTP metrics.
	app.get("/health", (_req, res) => {
		const dbUp = mongoose.connection.readyState === 1;
		res.status(dbUp ? 200 : 503).json({
			status: dbUp ? "ok" : "degraded",
			service: env.serviceName,
			mongodb: dbUp ? "connected" : "disconnected",
			uptime_seconds: Math.round(process.uptime()),
		});
	});

	app.use(
		cors({
			origin: env.corsOrigins,
			credentials: true,
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		})
	);

	app.use(httpObservability());
	app.use(express.json({ limit: "2mb" }));
	app.use(express.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(mongoSanitize());

	app.use(passport.initialize());
	googleAuth();

	app.get("/api/v1/test", (_req, res) => {
		res.json({ Hi: "Welcome to the Invoice App" });
	});

	app.use("/api/v1/auth", authRoutes);
	app.use("/api/v1/user", apiLimiter, userRoutes);
	app.use("/api/v1/customer", apiLimiter, customerRoutes);
	app.use("/api/v1/document", apiLimiter, documentRoutes);
	app.use("/api/v1/upload", apiLimiter, uploadRoutes);

	// The React app is served by the nginx container (see client/Dockerfile).
	app.get("/", (_req, res) => {
		res.json({ service: env.serviceName, docs: "/api/v1/test" });
	});

	app.use(notFound);
	app.use(errorHandler);

	return app;
}

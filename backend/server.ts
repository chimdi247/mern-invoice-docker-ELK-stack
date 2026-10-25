import { createApp } from "./app.js";
import connectionToDB from "./config/connectDB.js";
import { assertRequiredEnv, env } from "./config/env.js";
import { closePdfRenderer } from "./helpers/pdfRenderer.js";
import { systemLogs } from "./utils/Logger.js";
import mongoose from "mongoose";

async function main() {
	assertRequiredEnv();
	if (env.autoVerifyEmail) {
		systemLogs.warn("e2e_auto_verify_enabled", { hint: "E2E_AUTO_VERIFY is a test hook - do not use in production" });
	}
	await connectionToDB();

	const server = createApp().listen(env.port, () => {
		systemLogs.info("server_started", { port: env.port, mode: env.nodeEnv });
	});

	const shutdown = (signal: string) => {
		systemLogs.info("server_stopping", { signal });
		server.close(async () => {
			await closePdfRenderer();
			await mongoose.disconnect();
			process.exit(0);
		});
		setTimeout(() => process.exit(1), 10_000).unref();
	};
	process.once("SIGTERM", () => shutdown("SIGTERM"));
	process.once("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
	systemLogs.error("startup_failed", { message: (error as Error).message });
	// give the console transport a tick to flush, then exit non-zero so docker restarts us
	setTimeout(() => process.exit(1), 100);
});

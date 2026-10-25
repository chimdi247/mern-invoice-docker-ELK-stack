import mongoose from "mongoose";
import { env } from "./env.js";
import { systemLogs } from "../utils/Logger.js";

/** Connects to MongoDB, retrying while the database container is still starting. */
const connectionToDB = async (retries = 10, delayMs = 3000): Promise<void> => {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const connection = await mongoose.connect(env.mongoUri, { dbName: env.dbName });
			systemLogs.info("mongodb_connected", { host: connection.connection.host, db: env.dbName });
			return;
		} catch (error) {
			systemLogs.error("mongodb_connection_failed", {
				attempt,
				retries,
				message: (error as Error).message,
			});
			if (attempt === retries) {
				throw error;
			}
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
};

export default connectionToDB;

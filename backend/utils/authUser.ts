import type { Request } from "express";
import type { HydratedDocument } from "mongoose";
import type { IUser } from "../models/userModel.js";

/** The authenticated user set by `checkAuth` (throws a 401 if the middleware did not run). */
export function authUser(req: Request): HydratedDocument<IUser> {
	if (!req.user) {
		const error = new Error("Not authenticated") as Error & { statusCode?: number };
		error.statusCode = 401;
		throw error;
	}
	return req.user as unknown as HydratedDocument<IUser>;
}

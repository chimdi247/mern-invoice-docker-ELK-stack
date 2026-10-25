import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/userModel.js";

interface AccessTokenPayload extends jwt.JwtPayload {
	id: string;
	roles: string[];
}

/** Verifies `Authorization: Bearer <access token>` and loads the user. 401 = no token, 403 = invalid/expired. */
const checkAuth: RequestHandler = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith("Bearer ")) {
		res.sendStatus(401);
		return;
	}

	let decoded: AccessTokenPayload;
	try {
		decoded = jwt.verify(authHeader.split(" ")[1] as string, env.jwtAccessSecret) as AccessTokenPayload;
	} catch {
		res.sendStatus(403);
		return;
	}

	const user = await User.findById(decoded.id).select("-password");
	if (!user) {
		res.sendStatus(401);
		return;
	}
	req.user = user as unknown as Express.User;
	req.roles = decoded.roles;
	next();
};

export default checkAuth;

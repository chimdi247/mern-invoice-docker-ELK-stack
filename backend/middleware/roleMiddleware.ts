import type { RequestHandler } from "express";
import { ADMIN, USER } from "../constants/index.js";

const ROLES = { User: USER, Admin: ADMIN } as const;

const checkRole = (...allowedRoles: string[]): RequestHandler => {
	return (req, res, next) => {
		if (!req.user && !req.roles) {
			res.status(401);
			throw new Error("You are not authorized to use our platform");
		}

		const roleFound = (req.roles ?? []).some((role) => allowedRoles.includes(role));
		if (!roleFound) {
			res.status(401);
			throw new Error("You are not authorized to perform this request");
		}
		next();
	};
};

const role = { ROLES, checkRole };

export default role;

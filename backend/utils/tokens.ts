import { randomUUID } from "node:crypto";
import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import { env } from "../config/env.js";

export const refreshCookieOptions = (): CookieOptions => ({
	httpOnly: true,
	maxAge: env.cookie.maxAge,
	secure: env.cookie.secure,
	sameSite: env.cookie.sameSite,
});

export const signAccessToken = (id: Types.ObjectId | string, roles: string[]) =>
	jwt.sign({ id, roles }, env.jwtAccessSecret, { expiresIn: "10m" });

// `jwtid` makes every refresh token unique even when two are issued in the same second
// (rotation + re-use detection compare the token strings).
export const signRefreshToken = (id: Types.ObjectId | string) =>
	jwt.sign({ id }, env.jwtRefreshSecret, { expiresIn: "1d", jwtid: randomUUID() });

export const setRefreshCookie = (res: Response, token: string) => res.cookie("jwt", token, refreshCookieOptions());

export const clearRefreshCookie = (res: Response) => res.clearCookie("jwt", refreshCookieOptions());

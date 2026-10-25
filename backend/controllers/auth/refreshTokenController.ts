import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import User from "../../models/userModel.js";
import { clearRefreshCookie, setRefreshCookie, signAccessToken, signRefreshToken } from "../../utils/tokens.js";

// $-title   Get new access tokens from the refresh token
// $-path    GET /api/v1/auth/new_access_token
// $-auth    Public
// Refresh tokens are rotated: the old one is deleted, a new one issued, and re-use is detected.
const newAccessToken = async (req: Request, res: Response) => {
	const refreshToken = (req.cookies as Record<string, string> | undefined)?.jwt;

	if (!refreshToken) {
		res.sendStatus(401);
		return;
	}

	clearRefreshCookie(res);

	const existingUser = await User.findOne({ refreshToken }).exec();

	// token not known: either forged or already used -> if it is a valid token, revoke the whole family
	if (!existingUser) {
		try {
			const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as jwt.JwtPayload;
			const hackedUser = await User.findOne({ _id: decoded.id }).exec();
			if (hackedUser) {
				hackedUser.refreshToken = [];
				await hackedUser.save();
			}
		} catch {
			/* invalid token: nothing to revoke */
		}
		res.sendStatus(403);
		return;
	}

	const remaining = existingUser.refreshToken.filter((refT) => refT !== refreshToken);

	let decoded: jwt.JwtPayload;
	try {
		decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as jwt.JwtPayload;
	} catch {
		existingUser.refreshToken = remaining;
		await existingUser.save();
		res.sendStatus(403);
		return;
	}

	if (existingUser._id.toString() !== decoded.id) {
		res.sendStatus(403);
		return;
	}

	const accessToken = signAccessToken(existingUser._id, existingUser.roles);
	const newRefreshToken = signRefreshToken(existingUser._id);

	existingUser.refreshToken = [...remaining, newRefreshToken];
	await existingUser.save();

	setRefreshCookie(res, newRefreshToken);

	res.json({
		success: true,
		firstName: existingUser.firstName,
		lastName: existingUser.lastName,
		username: existingUser.username,
		provider: existingUser.provider,
		avatar: existingUser.avatar,
		accessToken,
	});
};

export default newAccessToken;

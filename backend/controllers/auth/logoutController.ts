import type { Request, Response } from "express";
import User from "../../models/userModel.js";
import { clearRefreshCookie } from "../../utils/tokens.js";

// $-title   Logout user and drop the refresh token
// $-path    GET /api/v1/auth/logout
// $-auth    Public
const logoutUser = async (req: Request, res: Response) => {
	const refreshToken = (req.cookies as Record<string, string> | undefined)?.jwt;

	if (!refreshToken) {
		res.sendStatus(204);
		return;
	}

	const existingUser = await User.findOne({ refreshToken });
	if (!existingUser) {
		clearRefreshCookie(res);
		res.sendStatus(204);
		return;
	}

	existingUser.refreshToken = existingUser.refreshToken.filter((refT) => refT !== refreshToken);
	await existingUser.save();

	clearRefreshCookie(res);

	res.status(200).json({
		success: true,
		message: `${existingUser.firstName},you have been logged out successfully`,
	});
};

export default logoutUser;

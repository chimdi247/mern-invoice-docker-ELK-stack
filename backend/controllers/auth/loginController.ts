import type { Request, Response } from "express";
import User from "../../models/userModel.js";
import { bizMetrics } from "../../observability/metrics.js";
import { systemLogs } from "../../utils/Logger.js";
import { clearRefreshCookie, setRefreshCookie, signAccessToken, signRefreshToken } from "../../utils/tokens.js";

// $-title   Login User, get access and refresh tokens
// $-path    POST /api/v1/auth/login
// $-auth    Public
const loginUser = async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (!email || !password) {
		res.status(400);
		throw new Error("Please provide an email and password");
	}

	const existingUser = await User.findOne({ email }).select("+password");

	if (!existingUser || !(await existingUser.comparePassword(password))) {
		bizMetrics.userLogins.add(1, { outcome: "failure" });
		systemLogs.warn("login_failed", { reason: "incorrect_credentials" });
		res.status(401);
		throw new Error("Incorrect email or password");
	}

	if (!existingUser.isEmailVerified) {
		res.status(400);
		throw new Error(
			"You are not verified. Check your email, a verification email link was sent when you registered"
		);
	}

	if (!existingUser.active) {
		res.status(400);
		throw new Error("You have been deactivated by the admin and login is impossible. Contact us for enquiries");
	}

	const accessToken = signAccessToken(existingUser._id, existingUser.roles);
	const newRefreshToken = signRefreshToken(existingUser._id);

	const cookies = req.cookies as Record<string, string> | undefined;
	let newRefreshTokenArray = !cookies?.jwt
		? existingUser.refreshToken
		: existingUser.refreshToken.filter((refT) => refT !== cookies.jwt);

	if (cookies?.jwt) {
		// token reuse detection: a refresh cookie that no user owns means it was already rotated
		const existingRefreshToken = await User.findOne({ refreshToken: cookies.jwt }).exec();
		if (!existingRefreshToken) {
			newRefreshTokenArray = [];
		}
		clearRefreshCookie(res);
	}

	existingUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
	await existingUser.save();

	setRefreshCookie(res, newRefreshToken);
	bizMetrics.userLogins.add(1, { outcome: "success" });

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

export default loginUser;

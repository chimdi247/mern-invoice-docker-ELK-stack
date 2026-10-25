import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import User from "../../models/userModel.js";
import VerificationToken from "../../models/verifyResetTokenModel.js";
import sendEmail from "../../utils/sendEmail.js";

// $-title   Resend Email Verification Tokens
// $-path    POST /api/v1/auth/resend_email_token
// $-auth    Public
const resendEmailVerificationToken = async (req: Request, res: Response) => {
	const { email } = req.body;

	if (!email) {
		res.status(400);
		throw new Error("An email must be provided");
	}

	const user = await User.findOne({ email });

	if (!user) {
		res.status(400);
		throw new Error("We were unable to find a user with that email address");
	}

	if (user.isEmailVerified) {
		res.status(400);
		throw new Error("This account has already been verified. Please login");
	}

	// remove this user's previous token(s) (it used to delete an arbitrary one)
	await VerificationToken.deleteMany({ _userId: user._id });

	const emailToken = await new VerificationToken({
		_userId: user._id,
		token: randomBytes(32).toString("hex"),
	}).save();

	const emailLink = `${env.domain}/api/v1/auth/verify/${emailToken.token}/${user._id}`;

	await sendEmail(
		user.email,
		"Account Verification",
		{ name: user.firstName, link: emailLink },
		"accountVerification.handlebars"
	);

	res.json({
		success: true,
		message: `${user.firstName}, an email has been sent to your account, please verify within 15 minutes`,
	});
};

export default resendEmailVerificationToken;

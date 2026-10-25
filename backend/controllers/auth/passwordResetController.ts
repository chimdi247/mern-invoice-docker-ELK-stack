import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import User from "../../models/userModel.js";
import VerificationToken from "../../models/verifyResetTokenModel.js";
import { bizMetrics } from "../../observability/metrics.js";
import sendEmail from "../../utils/sendEmail.js";

// $-title   Send password reset email link
// $-path    POST /api/v1/auth/reset_password_request
// $-auth    Public
const resetPasswordRequest = async (req: Request, res: Response) => {
	const { email } = req.body;

	if (!email) {
		res.status(400);
		throw new Error("You must enter your email address");
	}

	const existingUser = await User.findOne({ email }).select("-passwordConfirm");

	if (!existingUser) {
		res.status(400);
		throw new Error("That email is not associated with any account");
	}

	if (!existingUser.isEmailVerified) {
		res.status(400);
		throw new Error("Please verify your email address before resetting your password");
	}

	await VerificationToken.deleteMany({ _userId: existingUser._id });

	const newVerificationToken = await new VerificationToken({
		_userId: existingUser._id,
		token: randomBytes(32).toString("hex"),
		createdAt: Date.now(),
	}).save();

	const emailLink = `${env.clientUrl}/auth/reset_password?emailToken=${newVerificationToken.token}&userId=${existingUser._id}`;

	await sendEmail(
		existingUser.email,
		"Password Reset Request",
		{ name: existingUser.firstName, link: emailLink },
		"requestResetPassword.handlebars"
	);

	bizMetrics.passwordResets.add(1, { stage: "requested" });

	res.status(200).json({
		success: true,
		message: `Hey ${existingUser.firstName}, an email has been sent to your account with the password reset link`,
	});
};

// $-title   Reset User Password
// $-path    POST /api/v1/auth/reset_password
// $-auth    Public
const resetPassword = async (req: Request, res: Response) => {
	const { password, passwordConfirm, userId, emailToken } = req.body;

	if (!password) {
		res.status(400);
		throw new Error("A password is required");
	}
	if (!passwordConfirm) {
		res.status(400);
		throw new Error("A confirm password field is required");
	}
	if (password !== passwordConfirm) {
		res.status(400);
		throw new Error("Passwords do not match");
	}
	if (password.length < 8) {
		res.status(400);
		throw new Error("Passwords must be at least 8 characters long");
	}

	// The token must belong to this user AND match the emailed token (the original looked up a field
	// that does not exist in the schema, so any request could pick up some other user's token).
	const passwordResetToken = await VerificationToken.findOne({ _userId: userId, token: emailToken });

	if (!passwordResetToken) {
		res.status(400);
		throw new Error("Your token is either invalid or expired. Try resetting your password again");
	}

	const user = await User.findById(passwordResetToken._userId).select("-passwordConfirm");
	if (!user) {
		res.status(400);
		throw new Error("That user does not exist");
	}

	user.password = password;
	await user.save();
	await passwordResetToken.deleteOne();

	await sendEmail(user.email, "Password Reset Success", { name: user.firstName }, "resetPassword.handlebars");

	bizMetrics.passwordResets.add(1, { stage: "completed" });

	res.json({
		success: true,
		message: `Hey ${user.firstName},Your password reset was successful. An email has been sent to confirm the same`,
	});
};

export { resetPasswordRequest, resetPassword };

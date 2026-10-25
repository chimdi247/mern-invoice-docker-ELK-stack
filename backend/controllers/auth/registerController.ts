import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import User from "../../models/userModel.js";
import VerificationToken from "../../models/verifyResetTokenModel.js";
import { bizMetrics } from "../../observability/metrics.js";
import sendEmail from "../../utils/sendEmail.js";

// $-title   Register User and send email verification link
// $-path    POST /api/v1/auth/register
// $-auth    Public
const registerUser = async (req: Request, res: Response) => {
	const { email, username, firstName, lastName, password, passwordConfirm } = req.body;

	if (!email) {
		res.status(400);
		throw new Error("An email address is required");
	}
	if (!username) {
		res.status(400);
		throw new Error("A username is required");
	}
	if (!firstName || !lastName) {
		res.status(400);
		throw new Error("You must enter a full name with a first and last name");
	}
	if (!password) {
		res.status(400);
		throw new Error("You must enter a password");
	}
	if (!passwordConfirm) {
		res.status(400);
		throw new Error("Confirm password field is required");
	}

	const userExists = await User.findOne({ email });
	if (userExists) {
		res.status(400);
		throw new Error("The email address you've entered is already associated with another account");
	}

	const registeredUser = await new User({
		email,
		username,
		firstName,
		lastName,
		password,
		passwordConfirm,
		isEmailVerified: env.autoVerifyEmail,
	}).save();

	const verificationToken = randomBytes(32).toString("hex");
	const emailVerificationToken = await new VerificationToken({
		_userId: registeredUser._id,
		token: verificationToken,
	}).save();

	const emailLink = `${env.domain}/api/v1/auth/verify/${emailVerificationToken.token}/${registeredUser._id}`;

	await sendEmail(
		registeredUser.email,
		"Account Verification",
		{ name: registeredUser.firstName, link: emailLink },
		"accountVerification.handlebars"
	);

	bizMetrics.usersRegistered.add(1);

	res.json({
		success: true,
		message: `A new user ${registeredUser.firstName} has been registered! A Verification email has been sent to your account. Please verify within 15 minutes`,
	});
};

export default registerUser;

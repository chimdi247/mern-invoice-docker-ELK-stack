import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import User from "../../models/userModel.js";
import VerificationToken from "../../models/verifyResetTokenModel.js";
import { bizMetrics } from "../../observability/metrics.js";
import sendEmail from "../../utils/sendEmail.js";

// $-title   Verify User Email
// $-path    GET /api/v1/auth/verify/:emailToken/:userId
// $-auth    Public
const verifyUserEmail = async (req: Request, res: Response) => {
	const user = await User.findOne({ _id: req.params.userId }).select("-passwordConfirm");

	if (!user) {
		res.status(400);
		throw new Error("We were unable to find a user for this token");
	}

	if (user.isEmailVerified) {
		res.status(400).send("This user has already been verified. Please login");
		return;
	}

	const userToken = await VerificationToken.findOne({
		_userId: user._id,
		token: req.params.emailToken,
	});

	if (!userToken) {
		res.status(400);
		throw new Error("Token invalid! Your token may have expired");
	}

	user.isEmailVerified = true;
	await user.save();
	bizMetrics.emailsVerified.add(1);

	await sendEmail(
		user.email,
		"Welcome - Account Verified",
		{ name: user.firstName, link: `${env.clientUrl}/login` },
		"welcome.handlebars"
	);

	res.redirect(`${env.clientUrl}/auth/verify`);
};

export default verifyUserEmail;

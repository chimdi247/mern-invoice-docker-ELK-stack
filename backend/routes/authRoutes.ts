import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { env } from "../config/env.js";
import loginUser from "../controllers/auth/loginController.js";
import logoutUser from "../controllers/auth/logoutController.js";
import { resetPassword, resetPasswordRequest } from "../controllers/auth/passwordResetController.js";
import newAccessToken from "../controllers/auth/refreshTokenController.js";
import registerUser from "../controllers/auth/registerController.js";
import resendEmailVerificationToken from "../controllers/auth/resendVerifyEmailController.js";
import verifyUserEmail from "../controllers/auth/verifyEmailController.js";
import { loginLimiter } from "../middleware/apiLimiter.js";
import User from "../models/userModel.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:emailToken/:userId", verifyUserEmail);
router.post("/login", loginLimiter, loginUser);
router.get("/new_access_token", newAccessToken);
router.post("/resend_email_token", resendEmailVerificationToken);
router.post("/reset_password_request", resetPasswordRequest);
router.post("/reset_password", resetPassword);
router.get("/logout", logoutUser);

// $-title   Start the Google OAuth flow           GET /api/v1/auth/google
router.get(
	"/google",
	passport.authenticate("google", {
		session: false,
		scope: ["profile", "email"],
		accessType: "offline",
		prompt: "consent",
	})
);

// $-title   Redirect route of the passport google strategy   GET /api/v1/auth/google/redirect
router.get(
	"/google/redirect",
	passport.authenticate("google", { failureRedirect: `${env.clientUrl}/login`, session: false }),
	async (req, res) => {
		const existingUser = await User.findById((req.user as unknown as { id: string }).id);
		if (!existingUser) {
			res.redirect(`${env.clientUrl}/login`);
			return;
		}

		const payload = {
			id: existingUser.id,
			roles: existingUser.roles,
			firstName: existingUser.firstName,
			lastName: existingUser.lastName,
			username: existingUser.username,
			provider: existingUser.provider,
			avatar: existingUser.avatar,
		};
		const token = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: "20m" });

		res.redirect(`${env.clientUrl}/auth/google/callback?token=${encodeURIComponent(token)}`);
	}
);

export default router;

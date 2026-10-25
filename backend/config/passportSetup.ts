import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";
import { env } from "./env.js";

const googleAuth = () => {
	if (!env.google.clientId || !env.google.clientSecret) {
		// Google sign-in is optional; the e-mail/password flow works without it.
		return;
	}

	passport.use(
		new GoogleStrategy(
			{
				clientID: env.google.clientId,
				clientSecret: env.google.clientSecret,
				callbackURL: `${env.domain}/api/v1/${env.google.callbackPath}`,
			},
			async (_accessToken, _refreshToken, profile, done) => {
				try {
					const existing = await User.findOne({ googleID: profile.id });
					if (existing) {
						return done(null, existing as unknown as Express.User);
					}

					const [firstName, lastName] = (profile.displayName ?? "").split(" ");
					const json = profile._json as Record<string, string | boolean | undefined>;
					const created = await User.create({
						username: json.given_name as string,
						firstName,
						lastName,
						avatar: json.picture as string,
						email: json.email as string,
						googleID: profile.id,
						isEmailVerified: Boolean(json.email_verified),
						provider: "google",
					});
					return done(null, created as unknown as Express.User);
				} catch (error) {
					return done(error as Error, false);
				}
			}
		)
	);
};

export default googleAuth;

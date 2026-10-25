import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { systemLogs } from "../utils/Logger.js";

let transporter: Transporter | undefined;

/**
 * Gmail SMTP (smtp.gmail.com). Gmail requires 2-Step Verification + an App Password
 * (https://myaccount.google.com/apppasswords); the normal account password is rejected.
 *   - port 587 + STARTTLS (default)           SMTP_PORT=587 SMTP_SECURE=false
 *   - port 465 implicit TLS                   SMTP_PORT=465 SMTP_SECURE=true
 * For local experiments any other SMTP server works too (e.g. MailHog: SMTP_HOST=mailhog SMTP_PORT=1025).
 * The transport is created lazily so importing this module never needs credentials.
 */
export function getTransporter(): Transporter {
	if (!transporter) {
		const { host, port, secure, user, pass } = env.smtp;
		if (!user || !pass) {
			systemLogs.warn("smtp_credentials_missing", {
				hint: "Set SMTP_USER and SMTP_PASS (Gmail App Password) to send e-mail",
			});
		}
		transporter = nodemailer.createTransport({
			host,
			port,
			secure,
			requireTLS: !secure && host.endsWith("gmail.com"),
			auth: user ? { user, pass } : undefined,
			pool: true,
			maxConnections: 3,
		});
	}
	return transporter;
}

export const sendMail = (options: SendMailOptions) => getTransporter().sendMail(options);

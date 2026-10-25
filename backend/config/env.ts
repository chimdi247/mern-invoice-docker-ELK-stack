import "dotenv/config";

const bool = (value: string | undefined, fallback: boolean): boolean =>
	value === undefined || value === ""
		? fallback
		: ["1", "true", "yes", "on"].includes(value.toLowerCase());

const list = (value: string | undefined): string[] =>
	(value ?? "")
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean);

const domain = process.env.DOMAIN ?? "http://localhost:8080";
const smtpPort = Number(process.env.SMTP_PORT ?? 587);


/**
 * Typed, central access to configuration. Nothing else in the code base reads process.env
 * (except the OpenTelemetry bootstrap, which must run before this module is loaded).
 */
export const env = {
	nodeEnv: process.env.NODE_ENV ?? "development",
	isProduction: process.env.NODE_ENV === "production",
	port: Number(process.env.PORT ?? 1997),
	logLevel: process.env.LOG_LEVEL ?? "http",

	clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
	/**
	 * TEST HOOK - never enable in production. Registers accounts as already e-mail-verified so automated
	 * tests (tests/) can log in without reading a mailbox. Only set by tests/docker-compose.tests.yml.
	 */
	autoVerifyEmail: bool(process.env.E2E_AUTO_VERIFY, false),
	serviceName: process.env.OTEL_SERVICE_NAME ?? "invoice-api",

	mongoUri: process.env.MONGO_URI ?? "",
	dbName: process.env.DB_NAME ?? "invoice",

	/** Public URL of the app (links in e-mails, Google OAuth callback). */
	domain,
	corsOrigins: list(process.env.CORS_ORIGINS).length
		? list(process.env.CORS_ORIGINS)
		: [domain],

	jwtAccessSecret: process.env.JWT_ACCESS_SECRET_KEY ?? "",
	jwtRefreshSecret: process.env.JWT_REFRESH_SECRET_KEY ?? "",

	cookie: {
		// Set COOKIE_SECURE=true (and COOKIE_SAMESITE=none if the API is cross-site) behind HTTPS.
		secure: bool(process.env.COOKIE_SECURE, false),
		sameSite: (process.env.COOKIE_SAMESITE ?? "lax") as "lax" | "strict" | "none",
		maxAge: 24 * 60 * 60 * 1000,
	},

	/** Gmail SMTP (use an App Password: Google Account -> Security -> 2-Step Verification -> App passwords). */
	smtp: {
		host: process.env.SMTP_HOST ?? "smtp.gmail.com",
		port: smtpPort,
		secure: bool(process.env.SMTP_SECURE, smtpPort === 465),
		user: process.env.SMTP_USER ?? "",
		pass: process.env.SMTP_PASS ?? "",
	},
	senderEmail: process.env.SENDER_EMAIL || process.env.SMTP_USER || "",

	google: {
		clientId: process.env.GOOGLE_CLIENT_ID ?? "",
		clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		callbackPath: process.env.GOOGLE_CALLBACK_URL ?? "auth/google/redirect",
	},

	cloudinary: {
		cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
		apiKey: process.env.CLOUDINARY_API_KEY ?? "",
		apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
	},

	pdf: {
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/usr/bin/chromium",
		// remote hosts the PDF renderer may fetch images from (profile logos live on Cloudinary)
		allowedHosts: list(process.env.PDF_ALLOWED_HOSTS ?? "res.cloudinary.com"),
	},
} as const;

/** Fail fast with a clear message instead of crashing later with a cryptic one. */
export function assertRequiredEnv(): void {
	const missing: string[] = [];
	if (!env.mongoUri) missing.push("MONGO_URI");
	if (!env.jwtAccessSecret) missing.push("JWT_ACCESS_SECRET_KEY");
	if (!env.jwtRefreshSecret) missing.push("JWT_REFRESH_SECRET_KEY");
	if (missing.length) {
		throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
	}
}

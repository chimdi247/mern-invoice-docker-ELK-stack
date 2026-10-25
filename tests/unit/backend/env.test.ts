import { assertRequiredEnv, env } from "../../../backend/config/env";

describe("env", () => {
	it("defaults to Gmail SMTP on 587 with STARTTLS", () => {
		expect(env.smtp.host).toBe("smtp.gmail.com");
		expect(env.smtp.port).toBe(587);
		expect(env.smtp.secure).toBe(false);
	});

	it("uses SMTP_USER as the sender when SENDER_EMAIL is not set", () => {
		expect(env.senderEmail).toBe("tester@gmail.com");
	});

	it("does not auto-verify e-mail unless the test hook is enabled", () => {
		expect(env.autoVerifyEmail).toBe(false);
	});

	it("assertRequiredEnv passes when secrets and the mongo uri are present", () => {
		expect(() => assertRequiredEnv()).not.toThrow();
	});
});

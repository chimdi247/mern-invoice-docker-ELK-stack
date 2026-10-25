import { bizMetrics } from "../../../backend/observability/metrics";

const sendMail = vi.fn();
vi.mock("../../../backend/helpers/emailTransport", () => ({ sendMail: (...args: unknown[]) => sendMail(...args) }));

import sendEmail from "../../../backend/utils/sendEmail";

describe("sendEmail (Gmail SMTP transport mocked)", () => {
	beforeEach(() => {
		sendMail.mockReset();
	});

	it("renders the handlebars template and sends it from the configured sender", async () => {
		sendMail.mockResolvedValue({ messageId: "1" });
		const add = vi.spyOn(bizMetrics.emailsSent, "add");

		const ok = await sendEmail("bob@example.com", "Account Verification", { name: "Bob", link: "http://localhost:8080/x" }, "accountVerification.handlebars");

		expect(ok).toBe(true);
		const mail = sendMail.mock.calls[0]?.[0] as { from: string; to: string; subject: string; html: string };
		expect(mail.to).toBe("bob@example.com");
		expect(mail.from).toBe("tester@gmail.com"); // SENDER_EMAIL falls back to SMTP_USER
		expect(mail.subject).toBe("Account Verification");
		expect(mail.html).toContain("Bob");
		expect(add).toHaveBeenCalledWith(1, { template: "accountVerification.handlebars", outcome: "success" });
	});

	it("HTML-escapes template variables (handlebars default)", async () => {
		sendMail.mockResolvedValue({});
		await sendEmail("bob@example.com", "Hi", { name: "<b>x</b>", link: "l" }, "accountVerification.handlebars");
		expect((sendMail.mock.calls[0]?.[0] as { html: string }).html).not.toContain("<b>x</b>");
	});

	it("never throws when the SMTP server rejects: returns false and counts a failure", async () => {
		sendMail.mockRejectedValue(new Error("535 Username and Password not accepted"));
		const add = vi.spyOn(bizMetrics.emailsSent, "add");

		await expect(sendEmail("bob@example.com", "Hi", { name: "Bob", link: "l" }, "welcome.handlebars")).resolves.toBe(false);
		expect(add).toHaveBeenCalledWith(1, { template: "welcome.handlebars", outcome: "failure" });
	});
});

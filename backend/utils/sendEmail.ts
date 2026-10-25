import fs from "node:fs";
import path from "node:path";
import handlebars from "handlebars";
import { env } from "../config/env.js";
import { sendMail } from "../helpers/emailTransport.js";
import { bizMetrics } from "../observability/metrics.js";
import { systemLogs } from "./Logger.js";

const TEMPLATE_DIR = path.join(__dirname, "emails", "template");
const compiled = new Map<string, handlebars.TemplateDelegate>();

const getTemplate = (template: string) => {
	let fn = compiled.get(template);
	if (!fn) {
		fn = handlebars.compile(fs.readFileSync(path.join(TEMPLATE_DIR, template), "utf8"));
		compiled.set(template, fn);
	}
	return fn;
};

/**
 * Renders a handlebars template and sends it through Gmail SMTP. Failures are logged and counted but
 * never thrown: a mail outage must not turn a successful sign-up into a 500.
 * `template` is the file name inside utils/emails/template (e.g. "welcome.handlebars").
 */
const sendEmail = async (
	email: string,
	subject: string,
	payload: Record<string, unknown>,
	template: string
): Promise<boolean> => {
	try {
		await sendMail({
			from: env.senderEmail,
			to: email,
			subject,
			html: getTemplate(template)(payload),
		});
		bizMetrics.emailsSent.add(1, { template, outcome: "success" });
		systemLogs.info("email_sent", { template });
		return true;
	} catch (error) {
		bizMetrics.emailsSent.add(1, { template, outcome: "failure" });
		systemLogs.error("email_not_sent", { template, message: (error as Error).message });
		return false;
	}
};

export default sendEmail;

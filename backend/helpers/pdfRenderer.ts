import puppeteer, { type Browser } from "puppeteer-core";
import { env } from "../config/env.js";
import { bizMetrics } from "../observability/metrics.js";
import { systemLogs } from "../utils/Logger.js";

let browserPromise: Promise<Browser> | undefined;

/** One shared headless Chromium for the whole process (launching per request costs ~1s and ~100MB). */
function getBrowser(): Promise<Browser> {
	if (!browserPromise) {
		browserPromise = puppeteer
			.launch({
				executablePath: env.pdf.executablePath,
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
			})
			.then((browser) => {
				browser.on("disconnected", () => {
					browserPromise = undefined; // relaunch on next use
				});
				return browser;
			})
			.catch((error) => {
				browserPromise = undefined;
				throw error;
			});
	}
	return browserPromise;
}

const isAllowedRequest = (url: string): boolean => {
	if (url.startsWith("data:") || url === "about:blank") return true;
	try {
		const { protocol, hostname } = new URL(url);
		return protocol === "https:" && env.pdf.allowedHosts.includes(hostname);
	} catch {
		return false;
	}
};

/**
 * HTML -> PDF with headless Chromium (replaces html-pdf / PhantomJS, which is abandoned).
 * The HTML contains user-supplied data, so the page runs with JavaScript disabled and may only
 * fetch images from allow-listed hosts (PDF_ALLOWED_HOSTS) - no SSRF, no local files.
 */
export async function renderPdf(html: string): Promise<Buffer> {
	const start = process.hrtime.bigint();
	let outcome = "success";
	try {
		const browser = await getBrowser();
		const page = await browser.newPage();
		try {
			await page.setJavaScriptEnabled(false);
			await page.setRequestInterception(true);
			page.on("request", (request) => {
				if (isAllowedRequest(request.url())) void request.continue();
				else void request.abort();
			});
			await page.setContent(html, { waitUntil: "load", timeout: 15_000 });
			const pdf = await page.pdf({
				format: "A4",
				printBackground: true,
				margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
			});
			return Buffer.from(pdf);
		} finally {
			await page.close().catch(() => undefined);
		}
	} catch (error) {
		outcome = "failure";
		systemLogs.error("pdf_render_failed", { message: (error as Error).message });
		throw error;
	} finally {
		bizMetrics.pdfsGenerated.add(1, { outcome });
		bizMetrics.pdfDuration.record(Number(process.hrtime.bigint() - start) / 1e9);
	}
}

export async function closePdfRenderer(): Promise<void> {
	if (browserPromise) {
		const browser = await browserPromise.catch(() => undefined);
		await browser?.close().catch(() => undefined);
		browserPromise = undefined;
	}
}

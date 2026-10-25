import { escapeHtmlDeep } from "../../../backend/utils/escapeHtml";
import emailTemplate from "../../../backend/utils/pdf/emailTemplate";
import pdfTemplate from "../../../backend/utils/pdf/pdfTemplate";
import type { PdfPayload } from "../../../backend/utils/pdf/types";

const payload: PdfPayload = {
	profile: { firstName: "Jane", businessName: "Acme <script>", email: "jane@acme.test", avatar: "https://res.cloudinary.com/x/logo.png" },
	document: {
		documentType: "Invoice",
		documentNumber: "2026-October-ABC123",
		currency: "USD",
		total: 1234.5,
		subTotal: 1100,
		salesTax: 134.5,
		rates: 12,
		dueDate: "2026-11-01T00:00:00.000Z",
		createdAt: "2026-10-01T00:00:00.000Z",
		customer: { name: "Bob", email: "bob@example.com" },
		billingItems: [
			{ itemName: "Design", unitPrice: 100, quantity: 2, discount: 0 },
			{ itemName: "Hosting", unitPrice: 900, quantity: 1, discount: 0 },
		],
	},
	totalAmountReceived: 0,
	status: "Not Paid",
	balanceDue: 1234.5,
};

describe("pdfTemplate", () => {
	const html = pdfTemplate(payload);

	it("renders the document number and every billing line", () => {
		expect(html).toContain("2026-October-ABC123");
		expect(html).toContain("Design");
		expect(html).toContain("Hosting");
	});

	it("does not leak array separators (',') between table rows", () => {
		expect(html).not.toMatch(/<\/tr>\s*,\s*<tr/);
	});

	it("quotes the logo attribute", () => {
		expect(html).toContain('<img src="https://res.cloudinary.com/x/logo.png"');
	});

	it("is safe when the payload has been escaped (the controller does this)", () => {
		const safe = pdfTemplate(escapeHtmlDeep(payload));
		expect(safe).not.toContain("<script>");
		expect(safe).toContain("&lt;script&gt;");
	});
});

describe("emailTemplate", () => {
	it("mentions the sending business", () => {
		const html = emailTemplate(payload);
		expect(html).toContain("Acme");
	});
});

import { escapeHtml, escapeHtmlDeep } from "../../../backend/utils/escapeHtml";

describe("escapeHtml", () => {
	it("escapes the five HTML-significant characters", () => {
		expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe("&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;");
	});

	it("leaves normal text untouched", () => {
		expect(escapeHtml("Acme Ltd. 100%")).toBe("Acme Ltd. 100%");
	});
});

describe("escapeHtmlDeep", () => {
	it("escapes every string in nested structures, keeps numbers/booleans/null", () => {
		const input = { a: "<b>", n: 1, ok: true, nil: null, list: ["<i>", { x: "&" }] };
		expect(escapeHtmlDeep(input)).toEqual({ a: "&lt;b&gt;", n: 1, ok: true, nil: null, list: ["&lt;i&gt;", { x: "&amp;" }] });
	});
});

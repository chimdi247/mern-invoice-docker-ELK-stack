import { getErrorMessage } from "../../../client/src/utils/errors";

describe("getErrorMessage", () => {
	it("reads RTK Query errors", () => {
		expect(getErrorMessage({ status: 400, data: { message: "Passwords do not match" } })).toBe("Passwords do not match");
	});
	it("reads axios errors", () => {
		expect(getErrorMessage({ response: { data: { message: "Document not found" } } })).toBe("Document not found");
	});
	it("reads plain Errors and strings", () => {
		expect(getErrorMessage(new Error("boom"))).toBe("boom");
		expect(getErrorMessage("text")).toBe("text");
	});
	it("falls back for anything else", () => {
		expect(getErrorMessage(undefined)).toMatch(/something went wrong/i);
		expect(getErrorMessage({}, "custom")).toBe("custom");
	});
});

import type { Request, Response } from "express";
import mongoSanitize, { sanitize } from "../../../backend/middleware/mongoSanitize";

describe("sanitize()", () => {
	it("drops keys starting with $ (NoSQL operator injection)", () => {
		expect(sanitize({ email: { $gt: "" }, password: "x" })).toEqual({ email: {}, password: "x" });
	});

	it("drops keys containing a dot", () => {
		expect(sanitize({ "profile.role": "Admin", ok: 1 })).toEqual({ ok: 1 });
	});

	it("cleans nested objects and arrays but keeps plain values and Dates", () => {
		const date = new Date();
		expect(sanitize({ a: [{ $ne: 1, b: 2 }], when: date, n: 5, s: "text" })).toEqual({ a: [{ b: 2 }], when: date, n: 5, s: "text" });
	});
});

describe("mongoSanitize() middleware (Express 5: req.query is a getter)", () => {
	it("sanitizes body, params and query and calls next", () => {
		const req = { body: { $where: "1" }, params: { id: "1", "a.b": "x" }, query: { q: { $gt: "" } } } as unknown as Request;
		const next = vi.fn();

		mongoSanitize()(req, {} as Response, next);

		expect(req.body).toEqual({});
		expect(req.params).toEqual({ id: "1" });
		expect(req.query).toEqual({ q: {} });
		expect(next).toHaveBeenCalledOnce();
	});
});

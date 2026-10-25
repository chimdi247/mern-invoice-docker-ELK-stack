import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { errorHandler, notFound } from "../../../backend/middleware/errorMiddleware";

const makeRes = (statusCode = 200) => {
	const res = { statusCode, headersSent: false } as unknown as Response & { body?: Record<string, unknown> };
	res.status = vi.fn((code: number) => {
		res.statusCode = code;
		return res;
	}) as never;
	res.json = vi.fn((body: Record<string, unknown>) => {
		res.body = body;
		return res;
	}) as never;
	return res;
};
const req = { method: "GET", originalUrl: "/api/v1/x?token=secret" } as Request;
const next = vi.fn() as NextFunction;

describe("errorHandler", () => {
	it("keeps the status a controller set before throwing", () => {
		const res = makeRes(404);
		errorHandler(new Error("not here"), req, res, next);
		expect(res.statusCode).toBe(404);
		expect(res.body).toMatchObject({ success: false, message: "not here", statusCode: 404 });
	});

	it("turns an unexpected error that still has a 2xx status into a 500", () => {
		const res = makeRes(200);
		errorHandler(new Error("boom"), req, res, next);
		expect(res.statusCode).toBe(500);
	});

	it("maps Mongoose validation errors to 400", () => {
		const res = makeRes(200);
		errorHandler(new mongoose.Error.ValidationError(), req, res, next);
		expect(res.statusCode).toBe(400);
	});

	it("maps duplicate-key errors to 409", () => {
		const res = makeRes(200);
		errorHandler(Object.assign(new Error("E11000 duplicate key"), { code: 11000 }), req, res, next);
		expect(res.statusCode).toBe(409);
	});

	it("honours error.statusCode", () => {
		const res = makeRes(200);
		errorHandler(Object.assign(new Error("nope"), { statusCode: 401 }), req, res, next);
		expect(res.statusCode).toBe(401);
	});
});

describe("notFound", () => {
	it("sets 404 and forwards an error that names the route", () => {
		const res = makeRes();
		const forward = vi.fn();
		notFound({ originalUrl: "/api/v1/nope" } as Request, res, forward);
		expect(res.statusCode).toBe(404);
		expect(forward.mock.calls[0]?.[0]).toBeInstanceOf(Error);
		expect((forward.mock.calls[0]?.[0] as Error).message).toContain("/api/v1/nope");
	});
});

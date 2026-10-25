import type { NextFunction, Request, Response } from "express";
import role from "../../../backend/middleware/roleMiddleware";

const res = { status: vi.fn() } as unknown as Response;

describe("checkRole", () => {
	it("allows a user that has one of the allowed roles", () => {
		const next = vi.fn() as NextFunction;
		role.checkRole(role.ROLES.Admin)({ user: {}, roles: ["User", "Admin"] } as unknown as Request, res, next);
		expect(next).toHaveBeenCalledOnce();
	});

	it("rejects a plain User on an Admin route with 401", () => {
		const next = vi.fn() as NextFunction;
		expect(() => role.checkRole(role.ROLES.Admin)({ user: {}, roles: ["User"] } as unknown as Request, res, next)).toThrow(
			"You are not authorized to perform this request"
		);
		expect(res.status).toHaveBeenCalledWith(401);
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects an unauthenticated request", () => {
		expect(() => role.checkRole("Admin")({} as Request, res, vi.fn())).toThrow("not authorized to use our platform");
	});
});

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const findById = vi.fn();
vi.mock("../../../backend/models/userModel", () => ({ default: { findById: (...a: unknown[]) => ({ select: () => findById(...a) }) } }));

import checkAuth from "../../../backend/middleware/checkAuthMiddleware";

const res = () => ({ sendStatus: vi.fn() }) as unknown as Response & { sendStatus: ReturnType<typeof vi.fn> };
const reqWith = (authorization?: string) => ({ headers: { authorization } }) as unknown as Request;

describe("checkAuth", () => {
	beforeEach(() => findById.mockReset());

	it("401 without a bearer token", async () => {
		const r = res();
		await checkAuth(reqWith(), r, vi.fn());
		expect(r.sendStatus).toHaveBeenCalledWith(401);
	});

	it("403 for an invalid / expired token (the client uses 403 to trigger a refresh)", async () => {
		const r = res();
		await checkAuth(reqWith("Bearer not.a.jwt"), r, vi.fn());
		expect(r.sendStatus).toHaveBeenCalledWith(403);
	});

	it("loads the user and calls next for a valid token", async () => {
		const token = jwt.sign({ id: "u1", roles: ["User"] }, process.env.JWT_ACCESS_SECRET_KEY as string, { expiresIn: "5m" });
		findById.mockResolvedValue({ _id: "u1" });
		const req = reqWith(`Bearer ${token}`);
		const next = vi.fn() as NextFunction;

		await checkAuth(req, res(), next);

		expect(next).toHaveBeenCalledOnce();
		expect(req.roles).toEqual(["User"]);
		expect(req.user).toEqual({ _id: "u1" });
	});

	it("401 when the token is valid but the user no longer exists", async () => {
		const token = jwt.sign({ id: "gone", roles: [] }, process.env.JWT_ACCESS_SECRET_KEY as string);
		findById.mockResolvedValue(null);
		const r = res();
		await checkAuth(reqWith(`Bearer ${token}`), r, vi.fn());
		expect(r.sendStatus).toHaveBeenCalledWith(401);
	});
});

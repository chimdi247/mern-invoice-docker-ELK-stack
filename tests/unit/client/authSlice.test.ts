// @vitest-environment jsdom
import reducer, { logIn, logOut } from "../../../client/src/features/auth/authSlice";

describe("authSlice", () => {
	beforeEach(() => localStorage.clear());

	it("logIn stores the user in state and localStorage", () => {
		const user = { firstName: "Jane", accessToken: "t" };
		const state = reducer({ user: null, googleToken: null }, logIn(user));
		expect(state.user).toEqual(user);
		expect(JSON.parse(localStorage.getItem("user") as string)).toEqual(user);
	});

	it("logOut clears state and storage", () => {
		localStorage.setItem("user", "{}");
		localStorage.setItem("googleToken", "x");
		const state = reducer({ user: { accessToken: "t" }, googleToken: "x" }, logOut());
		expect(state).toEqual({ user: null, googleToken: null });
		expect(localStorage.getItem("user")).toBeNull();
		expect(localStorage.getItem("googleToken")).toBeNull();
	});
});

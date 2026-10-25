import User from "../../../backend/models/userModel";

const valid = {
	email: "jane@example.com",
	username: "jane_doe",
	firstName: "Jane",
	lastName: "Doe",
	password: "Str0ng!Passw0rd",
	passwordConfirm: "Str0ng!Passw0rd",
};
const errorsOf = (data: object) => Object.keys(new User(data).validateSync()?.errors ?? {});

describe("User model validation (no database needed)", () => {
	it("accepts a valid user and defaults roles/flags", () => {
		const user = new User(valid);
		expect(user.validateSync()).toBeUndefined();
		expect(user.isEmailVerified).toBe(false);
		expect(user.provider).toBe("email");
		expect(user.roles).toEqual(["User"]);
		expect(user.active).toBe(true);
	});

	it("lower-cases the e-mail", () => {
		expect(new User({ ...valid, email: "JANE@Example.COM" }).email).toBe("jane@example.com");
	});

	it.each([
		["email", { email: "not-an-email" }],
		["username", { username: "1abc" }],
		["username", { username: "ab" }],
		["firstName", { firstName: "Jane!" }],
		["lastName", { lastName: "D o e" }],
		["password", { password: "weakpass", passwordConfirm: "weakpass" }],
		["passwordConfirm", { passwordConfirm: "Different!Passw0rd1" }],
	])("rejects an invalid %s", (field, override) => {
		expect(errorsOf({ ...valid, ...override })).toContain(field);
	});

	it("rejects a missing phone number format", () => {
		expect(errorsOf({ ...valid, phoneNumber: "12345" })).toContain("phoneNumber");
	});
});

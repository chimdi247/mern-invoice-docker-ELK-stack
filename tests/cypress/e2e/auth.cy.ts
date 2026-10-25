describe("authentication", () => {
	it("shows the login page and validates the form", () => {
		cy.visit("/login");
		cy.get('input[name="email"]').type("not-an-email").blur();
		cy.get('input[name="password"]').focus().blur();
		cy.contains(/must be a valid email|valid email/i).should("be.visible");
	});

	it("rejects wrong credentials with an error toast", () => {
		cy.registerUser().then((user) => {
			cy.loginViaUi({ email: user.email, password: "Wrong!Passw0rd" });
			cy.contains(/incorrect email or password/i).should("be.visible");
			cy.location("pathname").should("eq", "/login");
		});
	});

	it("registers through the UI form", () => {
		const rand = Date.now().toString(36);
		cy.visit("/register");
		cy.get('input[name="firstName"]').type("Jane");
		cy.get('input[name="lastName"]').type("Doe");
		cy.get('input[name="username"]').type(`u${rand}`.slice(0, 20));
		cy.get('input[name="email"]').type(`ui-${rand}@example.com`);
		cy.get('input[name="password"]').type("Str0ng!Passw0rd", { log: false });
		cy.get('input[name="passwordConfirm"]').type("Str0ng!Passw0rd", { log: false });
		cy.contains("button", "Create Account").click();
		cy.contains(/has been registered|verification email/i, { timeout: 15_000 }).should("be.visible");
	});

	it("logs in with valid credentials and lands on the dashboard", () => {
		cy.registerUser().then((user) => {
			cy.loginViaUi(user);
			cy.location("pathname", { timeout: 15_000 }).should("eq", "/dashboard");
			cy.window().its("localStorage").invoke("getItem", "user").should("contain", "accessToken");
		});
	});

	it("redirects anonymous visitors from private pages to the login page", () => {
		cy.visit("/customers");
		cy.location("pathname").should("eq", "/login");
	});

	it("keeps the session across a reload and logs out", () => {
		cy.registerUser().then((user) => {
			cy.loginViaUi(user);
			cy.location("pathname", { timeout: 15_000 }).should("eq", "/dashboard");
			cy.reload();
			cy.location("pathname").should("eq", "/dashboard");
		});
	});
});

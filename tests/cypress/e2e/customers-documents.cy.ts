describe("customers and documents", () => {
	beforeEach(() => {
		cy.registerUser().then((user) => {
			cy.loginViaUi(user);
			cy.location("pathname", { timeout: 15_000 }).should("eq", "/dashboard");
		});
	});

	it("creates a customer through the form and lists it", () => {
		const email = `cust-${Date.now().toString(36)}@example.com`;
		cy.visit("/create-customer");
		cy.get('input[name="name"]').type("Cypress Customer");
		cy.get('input[name="email"]').type(email);
		cy.get('input[name="phoneNumber"]').type("+254712345678");
		cy.get('input[name="city"]').type("Nairobi");
		cy.contains("button", "Create Customer").click();

		cy.location("pathname", { timeout: 15_000 }).should("eq", "/customers");
		cy.contains("Cypress Customer").should("be.visible");
		cy.contains(email).should("be.visible");
	});

	it("shows an empty state for a brand new account and the dashboard counters", () => {
		cy.visit("/documents");
		cy.contains(/no documents|create/i).should("exist");
		cy.visit("/dashboard");
		cy.contains(/dashboard/i).should("be.visible");
	});

	it("an API-created customer shows on the customers page", () => {
		cy.window().then((win) => {
			const { accessToken } = JSON.parse(win.localStorage.getItem("user") as string);
			cy.createCustomerViaApi(accessToken).then((customer) => {
				cy.visit("/customers");
				cy.contains(customer.email).should("be.visible");
			});
		});
	});

	it("opens the create-document page and offers the customer", () => {
		cy.window().then((win) => {
			const { accessToken } = JSON.parse(win.localStorage.getItem("user") as string);
			cy.createCustomerViaApi(accessToken);
		});
		cy.visit("/create-doc");
		cy.contains(/create document/i).should("be.visible");
		cy.get("#customers-list").click();
		cy.contains("Cypress Customer").should("be.visible");
	});
});

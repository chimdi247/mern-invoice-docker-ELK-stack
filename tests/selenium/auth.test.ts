import { By, until, type WebDriver } from "selenium-webdriver";
import { APP_URL, buildDriver, registerViaApi } from "./driver";

let driver: WebDriver;

beforeAll(async () => {
	driver = await buildDriver();
});
afterAll(async () => {
	await driver?.quit();
});

const login = async (email: string, password: string) => {
	await driver.get(`${APP_URL}/login`);
	await driver.wait(until.elementLocated(By.css('input[name="email"]')), 15_000);
	await driver.findElement(By.css('input[name="email"]')).sendKeys(email);
	await driver.findElement(By.css('input[name="password"]')).sendKeys(password);
	await driver.findElement(By.css('button[type="submit"]')).click();
};

describe("login page (Selenium)", () => {
	it("renders the sign-in form", async () => {
		await driver.get(`${APP_URL}/login`);
		await driver.wait(until.elementLocated(By.css('input[name="email"]')), 15_000);
		expect(await driver.findElement(By.css('input[name="password"]')).isDisplayed()).toBe(true);
		expect(await driver.getTitle()).toContain("Login");
	});

	it("rejects wrong credentials with an error toast", async () => {
		const { email } = await registerViaApi();
		await login(email, "Wrong!Passw0rd");
		const toast = await driver.wait(until.elementLocated(By.xpath('//*[contains(text(),"Incorrect email or password")]')), 15_000);
		expect(await toast.isDisplayed()).toBe(true);
		expect(await driver.getCurrentUrl()).toContain("/login");
	});

	it("logs a registered user in and lands on the dashboard", async () => {
		const { email, password } = await registerViaApi();
		await login(email, password);
		await driver.wait(until.urlContains("/dashboard"), 15_000);
		const stored = (await driver.executeScript('return window.localStorage.getItem("user")')) as string;
		expect(stored).toContain("accessToken");
	});

	it("redirects anonymous users away from private pages", async () => {
		await driver.get(`${APP_URL}/`);
		await driver.executeScript("window.localStorage.clear()");
		await driver.get(`${APP_URL}/customers`);
		await driver.wait(until.urlContains("/login"), 15_000);
	});
});

describe("registration form (Selenium)", () => {
	it("creates an account", async () => {
		const rand = Date.now().toString(36);
		await driver.get(`${APP_URL}/register`);
		await driver.wait(until.elementLocated(By.css('input[name="firstName"]')), 15_000);
		const fill = async (name: string, value: string) => driver.findElement(By.css(`input[name="${name}"]`)).sendKeys(value);
		await fill("firstName", "Jane");
		await fill("lastName", "Doe");
		await fill("username", `u${rand}`.slice(0, 20));
		await fill("email", `sel-ui-${rand}@example.com`);
		await fill("password", "Str0ng!Passw0rd");
		await fill("passwordConfirm", "Str0ng!Passw0rd");
		await driver.findElement(By.css('button[type="submit"]')).click();
		const msg = await driver.wait(until.elementLocated(By.xpath('//*[contains(text(),"has been registered") or contains(text(),"erification")]')), 20_000);
		expect(await msg.isDisplayed()).toBe(true);
	});
});

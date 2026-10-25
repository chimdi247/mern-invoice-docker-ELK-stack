import { Builder, type WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";

export const APP_URL = process.env.APP_URL ?? "http://localhost:8080";
export const API_URL = process.env.API_URL ?? "http://localhost:8080/api/v1";

/**
 * Local Chrome (driver managed by Selenium Manager), or a Selenium Grid / standalone container:
 *   docker compose -f docker-compose.yml -f tests/docker-compose.tests.yml --profile selenium up -d selenium
 *   SELENIUM_REMOTE_URL=http://localhost:4444/wd/hub APP_URL=http://web:8080 API_URL=http://web:8080/api/v1 \
 *   npm run test:selenium
 * (when the browser runs inside the compose network use the service name `web` instead of localhost)
 */
export async function buildDriver(): Promise<WebDriver> {
	const options = new chrome.Options().addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--window-size=1440,900");
	const builder = new Builder().forBrowser("chrome").setChromeOptions(options);
	if (process.env.SELENIUM_REMOTE_URL) builder.usingServer(process.env.SELENIUM_REMOTE_URL);
	return builder.build();
}

export async function registerViaApi(): Promise<{ email: string; password: string }> {
	const rand = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
	const user = {
		email: `sel-${rand}@example.com`,
		username: `u${rand}`.slice(0, 20),
		firstName: "Jane",
		lastName: "Doe",
		password: "Str0ng!Passw0rd",
		passwordConfirm: "Str0ng!Passw0rd",
	};
	const res = await fetch(`${API_URL}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(user) });
	if (res.status !== 200) throw new Error(`register failed: ${res.status} ${await res.text()} (is tests/docker-compose.tests.yml applied?)`);
	return { email: user.email, password: user.password };
}

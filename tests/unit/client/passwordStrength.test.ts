import { strengthColor, strengthIndicator } from "../../../client/src/utils/password-strength";

describe("strengthIndicator", () => {
	it.each([
		["abc", 0],
		["abcdef", 1],
		["abcdefgh", 2],
		["abcdefg1", 3],
		["Abcdefg1", 4],
		["Abcdef1!", 5],
	])("%s -> %i", (password, score) => {
		expect(strengthIndicator(password)).toBe(score);
	});
});

describe("strengthColor", () => {
	it("maps scores to labels", () => {
		expect(strengthColor(1).label).toBe("Poor");
		expect(strengthColor(2).label).toBe("Weak");
		expect(strengthColor(3).label).toBe("Normal");
		expect(strengthColor(4).label).toBe("Good");
		expect(strengthColor(5).label).toBe("Strong");
	});
});

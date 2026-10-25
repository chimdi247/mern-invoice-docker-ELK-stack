const hasNumber = (value: string) => /[0-9]/.test(value);
const hasMixed = (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value);
const hasSpecial = (value: string) => /[!#@$%^&*)(+=._-]/.test(value);

export interface StrengthLevel {
	label: string;
	color: string;
}

export const strengthColor = (count: number): StrengthLevel => {
	if (count < 2) return { label: "Poor", color: "#FF1744" };
	if (count < 3) return { label: "Weak", color: "#FFEA00" };
	if (count < 4) return { label: "Normal", color: "#FFC400" };
	if (count < 5) return { label: "Good", color: "#52C41A" };
	if (count < 6) return { label: "Strong", color: "#C6FF00" };
	return { label: "Poor", color: "#ff4d4f" };
};

export const strengthIndicator = (value: string): number => {
	let strengths = 0;
	if (value.length > 5) strengths += 1;
	if (value.length > 7) strengths += 1;
	if (hasNumber(value)) strengths += 1;
	if (hasSpecial(value)) strengths += 1;
	if (hasMixed(value)) strengths += 1;
	return strengths;
};

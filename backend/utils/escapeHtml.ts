const ENTITIES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

export const escapeHtml = (value: string): string =>
	value.replace(/[&<>"']/g, (ch) => ENTITIES[ch] as string);

/** Recursively HTML-escapes every string in a JSON-like structure (used before rendering PDF/e-mail templates). */
export function escapeHtmlDeep<T>(input: T): T {
	if (typeof input === "string") return escapeHtml(input) as T;
	if (Array.isArray(input)) return input.map((v) => escapeHtmlDeep(v)) as T;
	if (input && typeof input === "object") {
		return Object.fromEntries(
			Object.entries(input as Record<string, unknown>).map(([k, v]) => [k, escapeHtmlDeep(v)])
		) as T;
	}
	return input;
}

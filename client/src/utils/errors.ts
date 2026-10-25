/**
 * Extracts a human readable message from anything a failed request can throw:
 * RTK Query errors ({ status, data: { message } }), serialized errors ({ message }), axios errors
 * ({ response: { data: { message } } }) or plain Errors.
 */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again"): string {
	if (typeof error === "string") return error;
	if (error && typeof error === "object") {
		const e = error as {
			data?: { message?: unknown } | string;
			message?: unknown;
			error?: unknown;
			response?: { data?: { message?: unknown } };
		};
		const candidates = [
			typeof e.data === "object" ? e.data?.message : undefined,
			typeof e.data === "string" ? e.data : undefined,
			e.response?.data?.message,
			e.message,
			e.error,
		];
		const found = candidates.find((c) => typeof c === "string" && c.length > 0);
		if (typeof found === "string") return found;
	}
	return fallback;
}

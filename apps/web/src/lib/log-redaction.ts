import type { LogFields } from "@zemio/logger";

/** Attribute shape AppSignal accepts: primitives only, no nested values. */
export type LogAttributes = Record<string, string | number | boolean>;

export const REDACTED = "[REDACTED]";

/**
 * Field names whose values identify a natural person. Their values are
 * replaced before any log leaves the process for AppSignal.
 *
 * This is the evidence for the promise that no user identifiers reach the
 * monitoring provider — the counterpart, for logs, of the data-minimisation
 * block in appsignal.cjs. Cited by the legal documents; if you change this
 * list, update them in the same commit.
 *
 * `organizationId` is deliberately NOT here: it identifies a customer
 * organization rather than a person, and keeping it is what makes a log line
 * actionable ("which tenant is broken?").
 */
const USER_IDENTIFIER_KEYS = new Set([
	"userid",
	"email",
	"emailaddress",
	"ip",
	"ipaddress",
]);

function isUserIdentifier(key: string): boolean {
	return USER_IDENTIFIER_KEYS.has(key.toLowerCase());
}

const CYCLE = "[Circular]";

/**
 * Recursively replaces identifier values inside nested structures.
 *
 * `seen` breaks reference cycles: a log field may hold a request, a socket or
 * an error whose `cause` points back at it, and recursing into one would
 * overflow the stack from inside the logging call itself.
 */
function redactDeep(
	value: unknown,
	seen: WeakSet<object> = new WeakSet(),
): unknown {
	if (value instanceof Error) {
		return { name: value.name, message: value.message };
	}

	if (value !== null && typeof value === "object") {
		if (seen.has(value)) {
			return CYCLE;
		}
		seen.add(value);

		if (Array.isArray(value)) {
			return value.map((entry) => redactDeep(entry, seen));
		}

		const result: Record<string, unknown> = {};
		for (const [key, nested] of Object.entries(value)) {
			result[key] = isUserIdentifier(key) ? REDACTED : redactDeep(nested, seen);
		}
		return result;
	}

	return value;
}

function toPrimitive(value: unknown): string | number | boolean {
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return value;
	}

	if (value instanceof Error) {
		return value.message;
	}

	// Never let a log line throw: serialisation runs over caller-supplied
	// objects, and a value JSON cannot represent (a BigInt, a getter that
	// raises) must degrade to a description rather than take out the request
	// the log was reporting on.
	try {
		return JSON.stringify(redactDeep(value)) ?? String(value);
	} catch {
		return String(value);
	}
}

/**
 * Flattens log fields into AppSignal attributes, redacting user identifiers.
 *
 * Absent keys stay absent; a present identifier becomes `[REDACTED]`, which
 * still distinguishes an authenticated request from an anonymous one without
 * naming anyone.
 */
export function toLogAttributes(fields?: LogFields): LogAttributes {
	const attributes: LogAttributes = {};
	if (!fields) {
		return attributes;
	}

	for (const [key, value] of Object.entries(fields)) {
		if (value === undefined || value === null) {
			continue;
		}
		attributes[key] = isUserIdentifier(key) ? REDACTED : toPrimitive(value);
	}

	return attributes;
}

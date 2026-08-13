import { describe, expect, it } from "vitest";
import { toMajorUnits } from "./billing";

describe("toMajorUnits", () => {
	/** Currencies arrive from Stripe in lower case, and are used as they come. */
	it("reads a two-decimal currency as hundredths", () => {
		expect(toMajorUnits(1900, "eur")).toBe(19);
	});

	it("reads a currency with no minor unit whole", () => {
		// ¥1,900 is ¥1,900, and Checkout charges that. A page dividing by a
		// hundred would offer the same tier at ¥19.
		expect(toMajorUnits(1900, "jpy")).toBe(1900);
		expect(toMajorUnits(1900, "krw")).toBe(1900);
	});

	it("reads a three-decimal currency as thousandths", () => {
		// The error runs the other way here: a hundred would price 1.900 KWD at
		// 19, ten times what the organization is about to agree to.
		expect(toMajorUnits(1900, "kwd")).toBe(1.9);
		expect(toMajorUnits(1900, "bhd")).toBe(1.9);
	});

	it("falls back to hundredths for a currency Intl does not know", () => {
		// Stripe adding a currency ahead of the runtime's data should read as an
		// ordinary price rather than throw the pricing page away.
		expect(toMajorUnits(1900, "xts")).toBe(19);
	});
});

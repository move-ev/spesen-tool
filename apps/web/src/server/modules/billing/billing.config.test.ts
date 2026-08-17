import { describe, expect, it } from "vitest";
import { parseBillingEnabled, resolveBillingConfig } from "./billing.config";

describe("parseBillingEnabled", () => {
	it("is off when the variable is absent or empty", () => {
		expect(parseBillingEnabled(undefined)).toBe(false);
		expect(parseBillingEnabled("")).toBe(false);
	});

	it.each(["true", "TRUE", "True", "1", " true "])("reads %o as on", (value) => {
		expect(parseBillingEnabled(value)).toBe(true);
	});

	it.each([
		"false",
		"FALSE",
		"0",
		"no",
		"off",
		"yes",
	])("reads %o as off", (value) => {
		expect(parseBillingEnabled(value)).toBe(false);
	});
});

describe("resolveBillingConfig when billing is off", () => {
	it("needs no credentials at all", () => {
		expect(resolveBillingConfig({})).toEqual({ enabled: false });
	});

	it("ignores credentials that happen to be present", () => {
		expect(
			resolveBillingConfig({
				BILLING_ENABLED: "false",
				STRIPE_SECRET_KEY: "sk_test_1",
				STRIPE_WEBHOOK_SECRET: "whsec_1",
			}),
		).toEqual({ enabled: false });
	});
});

describe("resolveBillingConfig when billing is on", () => {
	it("carries the credentials through", () => {
		expect(
			resolveBillingConfig({
				BILLING_ENABLED: "true",
				STRIPE_SECRET_KEY: "sk_test_1",
				STRIPE_WEBHOOK_SECRET: "whsec_1",
			}),
		).toEqual({
			enabled: true,
			secretKey: "sk_test_1",
			webhookSecret: "whsec_1",
		});
	});

	it("hands on credentials without the whitespace they were pasted with", () => {
		// A trailing newline survives a paste into a .env file or a secrets
		// manager and passes the presence check. Stripe would then reject every
		// call and every signature verification, blaming the key and the
		// signature rather than the newline on the end of them.
		expect(
			resolveBillingConfig({
				BILLING_ENABLED: "true",
				STRIPE_SECRET_KEY: "  sk_test_1\n",
				STRIPE_WEBHOOK_SECRET: "whsec_1\t",
			}),
		).toEqual({
			enabled: true,
			secretKey: "sk_test_1",
			webhookSecret: "whsec_1",
		});
	});

	it.each([
		[
			"STRIPE_SECRET_KEY",
			{ BILLING_ENABLED: "true", STRIPE_WEBHOOK_SECRET: "whsec_1" },
		],
		[
			"STRIPE_WEBHOOK_SECRET",
			{ BILLING_ENABLED: "true", STRIPE_SECRET_KEY: "sk_test_1" },
		],
	])("fails naming %s when it is missing", (missing, source) => {
		expect(() => resolveBillingConfig(source)).toThrow(missing);
	});

	it("names every missing variable at once rather than one per restart", () => {
		expect(() => resolveBillingConfig({ BILLING_ENABLED: "true" })).toThrow(
			/STRIPE_SECRET_KEY.*STRIPE_WEBHOOK_SECRET/,
		);
	});

	it("treats a blank credential as missing", () => {
		expect(() =>
			resolveBillingConfig({
				BILLING_ENABLED: "true",
				STRIPE_SECRET_KEY: "   ",
				STRIPE_WEBHOOK_SECRET: "whsec_1",
			}),
		).toThrow("STRIPE_SECRET_KEY");
	});
});

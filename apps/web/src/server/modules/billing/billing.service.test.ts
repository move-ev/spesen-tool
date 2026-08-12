import { describe, expect, it } from "vitest";
import { getBillingStatus } from "./billing.service";

describe("getBillingStatus when billing is off", () => {
	it("reports billing as disabled and the organization as entitled", () => {
		expect(getBillingStatus({ enabled: false })).toEqual({
			enabled: false,
			entitled: true,
		});
	});

	it("exposes nothing about the deployment beyond the two flags", () => {
		expect(Object.keys(getBillingStatus({ enabled: false })).sort()).toEqual([
			"enabled",
			"entitled",
		]);
	});
});

describe("getBillingStatus when billing is on", () => {
	it("reports billing as enabled without leaking the credentials", () => {
		const status = getBillingStatus({
			enabled: true,
			secretKey: "sk_test_1",
			webhookSecret: "whsec_1",
		});

		expect(status.enabled).toBe(true);
		expect(JSON.stringify(status)).not.toContain("sk_test_1");
		expect(JSON.stringify(status)).not.toContain("whsec_1");
	});
});

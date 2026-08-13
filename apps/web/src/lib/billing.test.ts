import { describe, expect, it } from "vitest";
import { type BannerStatus, resolveBillingBanner } from "./billing";

/** A healthy, enforced organization well inside its tier. */
const healthy: BannerStatus = {
	enabled: true,
	enforced: true,
	state: "entitled",
	overSeatLimit: false,
};

describe("resolveBillingBanner, when there is nothing to say", () => {
	it("shows nothing on a deployment that does not bill", () => {
		// A self-hoster has no billing to be warned about (ADR-0001).
		expect(resolveBillingBanner({ enabled: false })).toBeNull();
	});

	it("shows nothing to a healthy organization within its seats", () => {
		expect(resolveBillingBanner(healthy)).toBeNull();
	});

	it("shows nothing to an organization enforcement does not apply to", () => {
		// Billing is on for the deployment but this organization has not been
		// rolled out to yet. Nothing is being enforced against it, so warning it
		// about billing would be warning it about a rule it is not subject to.
		expect(
			resolveBillingBanner({
				enabled: true,
				enforced: false,
				state: "read_only",
				overSeatLimit: true,
			}),
		).toBeNull();
	});
});

describe("resolveBillingBanner, when something is wrong", () => {
	it("tells a lapsed organization it is read-only", () => {
		expect(resolveBillingBanner({ ...healthy, state: "read_only" })).toBe(
			"read_only",
		);
	});

	it("warns an organization whose payment is being retried", () => {
		expect(resolveBillingBanner({ ...healthy, state: "payment_failing" })).toBe(
			"payment_failing",
		);
	});

	it("tells an entitled organization it is over its seat limit", () => {
		expect(resolveBillingBanner({ ...healthy, overSeatLimit: true })).toBe(
			"over_seat_limit",
		);
	});
});

describe("resolveBillingBanner precedence", () => {
	// One banner at a time, most consequential first: being unable to create
	// work matters more than a seat count, and a failing payment is the thing
	// an owner can still act on before it becomes the former.

	it("puts being read-only ahead of the seat count", () => {
		expect(
			resolveBillingBanner({
				...healthy,
				state: "read_only",
				overSeatLimit: true,
			}),
		).toBe("read_only");
	});

	it("puts a failing payment ahead of the seat count", () => {
		expect(
			resolveBillingBanner({
				...healthy,
				state: "payment_failing",
				overSeatLimit: true,
			}),
		).toBe("payment_failing");
	});
});

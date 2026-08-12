import { describe, expect, it } from "vitest";
import {
	entitlementFromStripeStatus,
	isEntitled,
	isOverSeatLimit,
	resolveEntitlement,
} from "./billing.policy";

const subscription = { status: "active", seatLimit: 10 };

describe("entitlementFromStripeStatus", () => {
	it.each(["active", "trialing"])("treats %s as entitled", (status) => {
		expect(entitlementFromStripeStatus(status)).toBe("entitled");
	});

	it("keeps a past_due organization working while Stripe retries", () => {
		expect(entitlementFromStripeStatus("past_due")).toBe("payment_failing");
	});

	it.each(["canceled", "unpaid"])("treats %s as read-only", (status) => {
		expect(entitlementFromStripeStatus(status)).toBe("read_only");
	});

	it("warns on an incomplete first payment rather than refusing it", () => {
		// An SCA challenge the customer has not finished yet. Still completable.
		expect(entitlementFromStripeStatus("incomplete")).toBe("payment_failing");
	});

	it("makes a never-completed first payment read-only once it expires", () => {
		// Terminal: the organization has not paid and now cannot complete that
		// payment. Falling open here would give the product away indefinitely.
		expect(entitlementFromStripeStatus("incomplete_expired")).toBe("read_only");
	});

	it("keeps a paused subscription entitled", () => {
		// Pausing collection is a choice someone made, not a lapse.
		expect(entitlementFromStripeStatus("paused")).toBe("entitled");
	});

	it("falls open on a status Stripe has not told us about", () => {
		// Stripe can add statuses without asking. Locking a paying customer out
		// over a word we don't recognise is the worse of the two failures.
		expect(entitlementFromStripeStatus("something_new")).toBe("entitled");
		expect(entitlementFromStripeStatus("")).toBe("entitled");
	});
});

describe("resolveEntitlement enforcement switches", () => {
	it("entitles every organization when the deployment flag is off", () => {
		expect(
			resolveEntitlement({
				billingEnabled: false,
				enforcedForOrganization: true,
				subscription: null,
			}),
		).toBe("entitled");
	});

	it("entitles an organization that has not been opted into enforcement", () => {
		expect(
			resolveEntitlement({
				billingEnabled: true,
				enforcedForOrganization: false,
				subscription: null,
			}),
		).toBe("entitled");
	});

	it("entitles an unpaid organization while either switch is off", () => {
		const unpaid = { status: "unpaid", seatLimit: 10 };

		expect(
			resolveEntitlement({
				billingEnabled: false,
				enforcedForOrganization: false,
				subscription: unpaid,
			}),
		).toBe("entitled");
	});
});

describe("resolveEntitlement where enforcement applies", () => {
	const enforced = { billingEnabled: true, enforcedForOrganization: true };

	it("makes an organization with no subscription read-only", () => {
		expect(resolveEntitlement({ ...enforced, subscription: null })).toBe(
			"read_only",
		);
	});

	it("defers to the Stripe status when a subscription exists", () => {
		expect(resolveEntitlement({ ...enforced, subscription })).toBe("entitled");
		expect(
			resolveEntitlement({
				...enforced,
				subscription: { status: "canceled", seatLimit: 10 },
			}),
		).toBe("read_only");
	});
});

describe("isEntitled", () => {
	it("counts a failing payment as still entitled", () => {
		expect(isEntitled("entitled")).toBe(true);
		expect(isEntitled("payment_failing")).toBe(true);
		expect(isEntitled("read_only")).toBe(false);
	});
});

describe("isOverSeatLimit", () => {
	it("is true only once the count exceeds the limit", () => {
		expect(isOverSeatLimit(9, 10)).toBe(false);
		expect(isOverSeatLimit(10, 10)).toBe(false);
		expect(isOverSeatLimit(11, 10)).toBe(true);
	});

	it("is false when there is no limit to exceed", () => {
		expect(isOverSeatLimit(400, null)).toBe(false);
	});

	it("is independent of entitlement — an over-limit org stays entitled", () => {
		// ADR-0005: members are created automatically at tenant match, so an
		// organization can exceed its limit through nobody's action.
		expect(isOverSeatLimit(400, 25)).toBe(true);
		expect(
			resolveEntitlement({
				billingEnabled: true,
				enforcedForOrganization: true,
				subscription: { status: "active", seatLimit: 25 },
			}),
		).toBe("entitled");
	});
});

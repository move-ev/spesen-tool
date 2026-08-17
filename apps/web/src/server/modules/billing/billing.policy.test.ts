import { describe, expect, it } from "vitest";
import {
	entitlementFromStripeStatus,
	isEntitled,
	isOverSeatLimit,
	mayStartCheckout,
	resolveEntitlement,
} from "./billing.policy";

const subscription = { status: "active" };

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

	it("warns on a paused subscription without locking anyone out", () => {
		// Stripe reports `paused` only when a trial ended with no payment method,
		// so no invoice will ever be raised and Stripe will not move it on. Still
		// entitled, but it has to be said out loud — silence here is a product
		// given away indefinitely with nothing to pay against.
		expect(entitlementFromStripeStatus("paused")).toBe("payment_failing");
		expect(isEntitled(entitlementFromStripeStatus("paused"))).toBe(true);
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
		const unpaid = { status: "unpaid" };

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
				subscription: { status: "canceled" },
			}),
		).toBe("read_only");
	});

	it("reads nothing off a subscription but its status", () => {
		// Callers hand over the whole subscription row they already loaded. Every
		// other field on it — the seat limit above all — is beside the decision
		// rather than inside it (ADR-0005), which is why SubscriptionFacts names
		// only the one field.
		const row = {
			status: "canceled",
			tier: "M",
			seatLimit: 25,
			currentPeriodEnd: new Date(),
			cancelAtPeriodEnd: false,
		};

		expect(resolveEntitlement({ ...enforced, subscription: row })).toBe(
			"read_only",
		);
		expect(mayStartCheckout(row)).toBe(true);
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
				subscription: { status: "active" },
			}),
		).toBe("entitled");
	});
});

describe("mayStartCheckout", () => {
	it("lets an organization with no subscription buy one", () => {
		expect(mayStartCheckout(null)).toBe(true);
	});

	it.each([
		"active",
		"trialing",
		"past_due",
		"incomplete",
		"paused",
	])("refuses a second subscription while the first is %s", (status) => {
		expect(mayStartCheckout({ status })).toBe(false);
	});

	it.each([
		"canceled",
		"unpaid",
		"incomplete_expired",
	])("lets an organization whose subscription is %s buy again", (status) => {
		expect(mayStartCheckout({ status })).toBe(true);
	});

	it("refuses on an unrecognised status, which resolves as live", () => {
		// Fail-open on entitlement means fail-closed on buying again: an unknown
		// status is treated as a subscription that exists, and a second one would
		// be billed without being recorded.
		expect(mayStartCheckout({ status: "something_new" })).toBe(false);
	});
});

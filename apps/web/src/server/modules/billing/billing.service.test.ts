import { createMockDb } from "@zemio/test-utils";
import { describe, expect, it } from "vitest";
import { getBillingStatus } from "./billing.service";

const enabledConfig = {
	enabled: true,
	secretKey: "sk_test_1",
	webhookSecret: "whsec_1",
} as const;

function dbWith(args: {
	billingEnforced?: boolean;
	subscription?: { tier: string; seatLimit: number; status: string } | null;
	seats?: number;
}) {
	const db = createMockDb();
	db.organization.findUnique.mockResolvedValue({
		billingEnforced: args.billingEnforced ?? true,
		subscription: args.subscription ?? null,
	} as never);
	db.member.count.mockResolvedValue((args.seats ?? 0) as never);
	return db;
}

describe("getBillingStatus when billing is off", () => {
	it("reports billing as disabled and the organization as entitled", async () => {
		const db = dbWith({});

		await expect(
			getBillingStatus({ db, config: { enabled: false } }, "org_1"),
		).resolves.toEqual({ enabled: false, entitled: true });
	});

	it("reads no organization state at all", async () => {
		const db = dbWith({});

		await getBillingStatus({ db, config: { enabled: false } }, "org_1");

		expect(db.organization.findUnique).not.toHaveBeenCalled();
		expect(db.member.count).not.toHaveBeenCalled();
	});
});

describe("getBillingStatus with a subscription", () => {
	it("reports the tier, seat limit, seat count and entitlement state", async () => {
		const db = dbWith({
			subscription: { tier: "M", seatLimit: 25, status: "active" },
			seats: 12,
		});

		await expect(
			getBillingStatus({ db, config: enabledConfig }, "org_1"),
		).resolves.toEqual({
			enabled: true,
			entitled: true,
			state: "entitled",
			tier: "M",
			seatLimit: 25,
			seatCount: 12,
			overSeatLimit: false,
		});
	});

	it("reports an over-limit organization as over limit and still entitled", async () => {
		const db = dbWith({
			subscription: { tier: "S", seatLimit: 10, status: "active" },
			seats: 400,
		});

		const status = await getBillingStatus({ db, config: enabledConfig }, "org_1");

		expect(status).toMatchObject({
			overSeatLimit: true,
			entitled: true,
			state: "entitled",
			seatCount: 400,
		});
	});

	it("flags a failing payment without withdrawing entitlement", async () => {
		const db = dbWith({
			subscription: { tier: "M", seatLimit: 25, status: "past_due" },
			seats: 5,
		});

		await expect(
			getBillingStatus({ db, config: enabledConfig }, "org_1"),
		).resolves.toMatchObject({ state: "payment_failing", entitled: true });
	});

	it("makes a lapsed organization read-only", async () => {
		const db = dbWith({
			subscription: { tier: "M", seatLimit: 25, status: "canceled" },
			seats: 5,
		});

		await expect(
			getBillingStatus({ db, config: enabledConfig }, "org_1"),
		).resolves.toMatchObject({ state: "read_only", entitled: false });
	});
});

describe("getBillingStatus enforcement override", () => {
	it("entitles an organization not opted into enforcement, with no subscription", async () => {
		const db = dbWith({ billingEnforced: false, subscription: null, seats: 3 });

		await expect(
			getBillingStatus({ db, config: enabledConfig }, "org_1"),
		).resolves.toMatchObject({
			entitled: true,
			state: "entitled",
			tier: null,
			seatLimit: null,
			seatCount: 3,
		});
	});

	it("makes an enforced organization with no subscription read-only", async () => {
		const db = dbWith({ billingEnforced: true, subscription: null, seats: 3 });

		await expect(
			getBillingStatus({ db, config: enabledConfig }, "org_1"),
		).resolves.toMatchObject({ entitled: false, state: "read_only" });
	});
});

describe("getBillingStatus exposure", () => {
	it("leaks no Stripe credentials into the status", async () => {
		const db = dbWith({
			subscription: { tier: "M", seatLimit: 25, status: "active" },
		});

		const status = await getBillingStatus({ db, config: enabledConfig }, "org_1");

		expect(JSON.stringify(status)).not.toContain("sk_test_1");
		expect(JSON.stringify(status)).not.toContain("whsec_1");
	});

	it("treats a missing organization as unentitled rather than crashing", async () => {
		const db = createMockDb();
		db.organization.findUnique.mockResolvedValue(null as never);
		db.member.count.mockResolvedValue(0 as never);

		await expect(
			getBillingStatus({ db, config: enabledConfig }, "org_gone"),
		).resolves.toMatchObject({ state: "read_only", entitled: false });
	});
});

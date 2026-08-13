import {
	asTRPCContext,
	createMockOrgContext,
	expectTRPCErrorCode,
} from "@zemio/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Billing has to be on for these procedures to be reachable at all.
vi.mock("@/server/modules/billing/billing.config", async (importOriginal) => ({
	...(await importOriginal<object>()),
	billingConfig: {
		enabled: true,
		secretKey: "sk_test_1",
		webhookSecret: "whsec_1",
	},
}));

// A real client would need credentials. The refusal cases never reach it —
// which is the point: authorization is settled before anything is built.
const startCheckout = vi.fn();
vi.mock(
	"@/server/modules/billing/billing.checkout",
	async (importOriginal) => ({
		...(await importOriginal<object>()),
		startCheckout,
	}),
);

const pricesList = vi.fn();
vi.mock("@/server/modules/billing/billing.stripe", async (importOriginal) => ({
	// `withStripe` stays real: it is the boundary that keeps Stripe's own words
	// out of the browser, and replacing it here would test around it.
	...(await importOriginal<object>()),
	getStripe: () => ({ prices: { list: pricesList } }),
}));

const openBillingPortal = vi.fn();
vi.mock("@/server/modules/billing/billing.portal", () => ({
	openBillingPortal,
}));

const { billingRouter } = await import("@/server/api/routers/billing");
const { createCallerFactory } = await import("@/server/api/trpc");

const createCaller = createCallerFactory(billingRouter);

function caller(role: string) {
	const ctx = createMockOrgContext({
		organizationId: "org_1",
		member: { role },
	});
	ctx.db.organization.findUnique.mockResolvedValue({
		billingEnforced: false,
		subscription: null,
	} as never);
	ctx.db.member.count.mockResolvedValue(1 as never);
	return createCaller(asTRPCContext(ctx));
}

beforeEach(async () => {
	vi.clearAllMocks();
	startCheckout.mockResolvedValue({ url: "https://checkout.stripe.test/cs_1" });
	pricesList.mockResolvedValue({
		data: [
			{
				id: "price_m",
				active: true,
				currency: "eur",
				unit_amount: 1900,
				recurring: { interval: "month" },
				metadata: { zemio_tier: "M", zemio_seats: "25" },
			},
		],
		has_more: false,
	});
	const { clearTierCatalogue } = await import(
		"@/server/modules/billing/billing.catalogue"
	);
	clearTierCatalogue();
});

describe("billing.tiers", () => {
	it("lists the tiers on offer", async () => {
		await expect(caller("owner").tiers()).resolves.toEqual([
			{
				priceId: "price_m",
				name: "M",
				seatLimit: 25,
				amount: 1900,
				currency: "eur",
				interval: "month",
			},
		]);
	});

	it("answers plain members, who see the same public prices", async () => {
		await expect(caller("member").tiers()).resolves.toHaveLength(1);
	});
});

describe("billing.startCheckout authorization", () => {
	it("lets an owner start checkout", async () => {
		await expect(
			caller("owner").startCheckout({ priceId: "price_m" }),
		).resolves.toEqual({ url: "https://checkout.stripe.test/cs_1" });
	});

	it.each(["admin", "member"])("refuses an organization %s", async (role) => {
		await expectTRPCErrorCode(
			caller(role).startCheckout({ priceId: "price_m" }),
			"UNAUTHORIZED",
		);
	});

	it("builds nothing at all for a caller it refuses", async () => {
		await caller("admin")
			.startCheckout({ priceId: "price_m" })
			.catch(() => {});

		expect(startCheckout).not.toHaveBeenCalled();
	});

	it("passes the owner along as the actor behind the commitment", async () => {
		await caller("owner").startCheckout({ priceId: "price_m" });

		expect(startCheckout).toHaveBeenCalledWith(
			expect.anything(),
			{ organizationId: "org_1", userId: "user_1" },
			"price_m",
		);
	});

	it("rejects an empty price rather than asking Stripe about it", async () => {
		await expectTRPCErrorCode(
			caller("owner").startCheckout({ priceId: "" }),
			"BAD_REQUEST",
		);
		expect(startCheckout).not.toHaveBeenCalled();
	});
});

describe("billing.openPortal authorization", () => {
	it("lets an owner open the portal", async () => {
		openBillingPortal.mockResolvedValue({
			url: "https://billing.stripe.test/bps_1",
		});

		await expect(caller("owner").openPortal()).resolves.toEqual({
			url: "https://billing.stripe.test/bps_1",
		});
	});

	it.each(["admin", "member"])("refuses an organization %s", async (role) => {
		await expectTRPCErrorCode(caller(role).openPortal(), "UNAUTHORIZED");
		expect(openBillingPortal).not.toHaveBeenCalled();
	});

	it("opens the portal for the caller's own organization", async () => {
		openBillingPortal.mockResolvedValue({
			url: "https://billing.stripe.test/bps_1",
		});

		await caller("owner").openPortal();

		expect(openBillingPortal).toHaveBeenCalledWith(expect.anything(), "org_1");
	});
});

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
vi.mock("@/server/modules/billing/billing.checkout", () => ({ startCheckout }));

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

beforeEach(() => {
	vi.clearAllMocks();
	startCheckout.mockResolvedValue({ url: "https://checkout.stripe.test/cs_1" });
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

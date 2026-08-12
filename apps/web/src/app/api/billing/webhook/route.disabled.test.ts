import { describe, expect, it, vi } from "vitest";

// No config mock here: the suite pins BILLING_ENABLED off (vitest.setup.ts),
// which is the state every self-hosted instance runs in. The enabled path is
// in route.test.ts, since switching billing on means replacing the config
// module for a whole file.
const handleStripeEvent = vi.fn();
vi.mock("@/server/modules/billing/billing.webhook", () => ({
	handleStripeEvent,
}));
vi.mock("@/server/db", () => ({ db: {} }));

const { POST } = await import("./route");

describe("the Stripe webhook route with billing switched off", () => {
	it("offers no endpoint at all", async () => {
		const response = await POST(
			new Request("https://zemio.test/api/billing/webhook", {
				method: "POST",
				headers: { "stripe-signature": "t=1,v1=good" },
				body: "{}",
			}),
		);

		expect(response.status).toBe(404);
		expect(handleStripeEvent).not.toHaveBeenCalled();
	});
});

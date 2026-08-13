import { createMockDb, expectTRPCErrorCode } from "@zemio/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { openBillingPortal, type PortalDependencies } from "./billing.portal";

function deps(
	args: { stripeCustomerId?: string | null; organization?: unknown } = {},
) {
	const db = createMockDb();
	db.organization.findUnique.mockResolvedValue(
		(args.organization === undefined
			? {
					id: "org_1",
					name: "Robotics Society",
					stripeCustomerId:
						args.stripeCustomerId === undefined ? "cus_1" : args.stripeCustomerId,
				}
			: args.organization) as never,
	);

	const create = vi
		.fn()
		.mockResolvedValue({ id: "bps_1", url: "https://billing.stripe.test/bps_1" });

	return {
		db,
		stripe: { billingPortal: { sessions: { create } } },
		appUrl: "https://zemio.test",
		create,
	} as unknown as PortalDependencies & {
		db: ReturnType<typeof createMockDb>;
		create: ReturnType<typeof vi.fn>;
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("openBillingPortal", () => {
	it("returns the hosted page to send the owner to", async () => {
		const d = deps({});

		await expect(openBillingPortal(d, "org_1")).resolves.toEqual({
			url: "https://billing.stripe.test/bps_1",
		});
	});

	it("opens the portal for the customer the organization pays as", async () => {
		const d = deps({ stripeCustomerId: "cus_acme" });

		await openBillingPortal(d, "org_1");

		expect(d.create).toHaveBeenCalledWith(
			expect.objectContaining({ customer: "cus_acme" }),
		);
	});

	it("returns the owner to the billing page afterwards", async () => {
		const d = deps({});

		await openBillingPortal(d, "org_1");

		expect(d.create).toHaveBeenCalledWith(
			expect.objectContaining({
				return_url: "https://zemio.test/settings/org/billing",
			}),
		);
	});

	it("refuses an organization that has never paid, without inventing a customer", async () => {
		const d = deps({ stripeCustomerId: null });

		await expectTRPCErrorCode(
			openBillingPortal(d, "org_1"),
			"PRECONDITION_FAILED",
		);
		expect(d.create).not.toHaveBeenCalled();
	});

	it("refuses an organization that no longer exists", async () => {
		const d = deps({ organization: null });

		await expectTRPCErrorCode(openBillingPortal(d, "org_1"), "NOT_FOUND");
		expect(d.create).not.toHaveBeenCalled();
	});
});

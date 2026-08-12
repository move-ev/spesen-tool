import type { Prisma, PrismaClient } from "@zemio/db";

type Db = PrismaClient;

/**
 * Only the subscription fields entitlement and the status surface actually
 * read. The Stripe references are left out — nothing outside the webhook and
 * the portal needs them, and they must never reach the browser.
 */
const subscriptionSelect = {
	tier: true,
	seatLimit: true,
	status: true,
} satisfies Prisma.SubscriptionSelect;

const organizationBillingSelect = {
	billingEnforced: true,
	subscription: { select: subscriptionSelect },
} satisfies Prisma.OrganizationSelect;

export type OrganizationBillingRow = Prisma.OrganizationGetPayload<{
	select: typeof organizationBillingSelect;
}>;

export const billingRepository = {
	/** The organization's enforcement override and its subscription, if any. */
	findOrganizationBilling(
		db: Db,
		organizationId: string,
	): Promise<OrganizationBillingRow | null> {
		return db.organization.findUnique({
			where: { id: organizationId },
			select: organizationBillingSelect,
		});
	},

	/**
	 * Seats in use, counted on demand. There is no seat ledger to keep in sync
	 * and nothing is pushed to Stripe as a quantity (ADR-0005).
	 */
	countSeats(db: Db, organizationId: string): Promise<number> {
		return db.member.count({ where: { organizationId } });
	},
};

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

	/**
	 * Claims a Stripe event id. Raises `P2002` if it was already claimed, which
	 * is how a redelivery is recognised (ADR-0004).
	 */
	async recordStripeEvent(db: Db, id: string, type: string): Promise<void> {
		await db.processedStripeEvent.create({ data: { id, type } });
	},

	/** Releases a claimed event id so Stripe's redelivery can try again. */
	async forgetStripeEvent(db: Db, id: string): Promise<void> {
		await db.processedStripeEvent.delete({ where: { id } });
	},

	/** The organization paying as this Stripe customer, if Zemio knows one. */
	async findOrganizationIdByStripeCustomer(
		db: Db,
		stripeCustomerId: string,
	): Promise<string | null> {
		const organization = await db.organization.findUnique({
			where: { stripeCustomerId },
			select: { id: true },
		});
		return organization?.id ?? null;
	},

	/** Writes the organization's current subscription state, creating it if new. */
	async upsertSubscription(
		db: Db,
		organizationId: string,
		data: Omit<Prisma.SubscriptionUncheckedCreateInput, "organizationId">,
	): Promise<void> {
		await db.subscription.upsert({
			where: { organizationId },
			create: { organizationId, ...data },
			update: data,
		});
	},

	/**
	 * Updates a subscription only where one already exists, reporting how many
	 * rows moved. Used where Zemio has facts to record but not enough to create
	 * a row from.
	 */
	async updateSubscriptionIfPresent(
		db: Db,
		organizationId: string,
		data: Prisma.SubscriptionUpdateInput,
	): Promise<number> {
		const { count } = await db.subscription.updateMany({
			where: { organizationId },
			data,
		});
		return count;
	},
};

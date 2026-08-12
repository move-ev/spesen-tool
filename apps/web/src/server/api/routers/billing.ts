import { z } from "zod";
import {
	createTRPCRouter,
	orgOwnerProcedure,
	orgProcedure,
} from "@/server/api/trpc";
import {
	billingConfig,
	getBillingStatus,
	getStripe,
	listTiers,
	startCheckout,
	type Tier,
	toBillingServiceContext,
	toCheckoutDependencies,
} from "@/server/modules/billing";

export const billingRouter = createTRPCRouter({
	/**
	 * The single source the banner and the billing page both read. Available to
	 * every member, not just owners: a member needs to know their organization
	 * is read-only even though they cannot do anything about it.
	 */
	status: orgProcedure.query(({ ctx }) =>
		getBillingStatus(toBillingServiceContext(ctx), ctx.organizationId),
	),

	/**
	 * The tiers on offer, as Stripe defines them.
	 *
	 * Readable by any member — these are the same public prices anyone could
	 * see — but only an owner can act on them. An instance that does not bill
	 * offers none, rather than failing: there is nothing to sell (ADR-0001).
	 */
	tiers: orgProcedure.query((): Promise<Tier[]> | Tier[] =>
		billingConfig.enabled ? listTiers(getStripe()) : [],
	),

	/**
	 * Sends the owner to hosted checkout for a tier.
	 *
	 * Owner-only: this commits the organization to a recurring payment.
	 */
	startCheckout: orgOwnerProcedure
		.input(z.object({ priceId: z.string().min(1) }))
		.mutation(({ ctx, input }) =>
			startCheckout(
				toCheckoutDependencies(ctx),
				{ organizationId: ctx.organizationId, userId: ctx.session.user.id },
				input.priceId,
			),
		),
});

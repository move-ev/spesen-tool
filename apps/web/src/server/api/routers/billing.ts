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
	openBillingPortal,
	startCheckout,
	type Tier,
	toBillingDependencies,
	toBillingServiceContext,
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
				toBillingDependencies(ctx),
				{ organizationId: ctx.organizationId, userId: ctx.session.user.id },
				input.priceId,
			),
		),

	/**
	 * Sends the owner to the hosted portal to change payment method, download
	 * invoices, switch tier or cancel.
	 *
	 * Owner-only for the same reason as checkout, and not audited: what the
	 * owner then does is Stripe's to record, and Zemio only learns the outcome
	 * from the webhook (ADR-0007).
	 */
	openPortal: orgOwnerProcedure.mutation(({ ctx }) =>
		openBillingPortal(toBillingDependencies(ctx), ctx.organizationId),
	),
});

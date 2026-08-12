import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@zemio/db";
import { env } from "@/env";
import type { CheckoutDependencies } from "./billing.checkout";
import { billingConfig } from "./billing.config";
import type { PortalDependencies } from "./billing.portal";
import type { BillingServiceContext } from "./billing.service";
import { getStripe } from "./billing.stripe";

export type BillingRequestContext = {
	db: PrismaClient;
};

/**
 * The billing configuration is supplied here rather than living on the tRPC
 * context, so the shared context and the test utilities stay free of billing.
 */
export function toBillingServiceContext(
	ctx: BillingRequestContext,
): BillingServiceContext {
	return { db: ctx.db, config: billingConfig };
}

/**
 * The dependencies a billing mutation needs, assembled at the procedure.
 *
 * One factory for checkout and the portal both: they want the same three
 * things, and the guard below is the sort that must not be remembered
 * separately at each call site.
 *
 * Constructing the Stripe client here rather than on the context means only
 * the procedures that actually bill ever build one, and a service can be
 * tested by handing it a stub instead.
 *
 * Refuses before building anything when the deployment does not bill: a
 * self-hoster has no billing interface to reach this from, and one that
 * reaches it anyway deserves a plain answer rather than the credentials error
 * `getStripe` would raise (ADR-0001).
 */
export function toBillingDependencies(
	ctx: BillingRequestContext,
): CheckoutDependencies & PortalDependencies {
	if (!billingConfig.enabled) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "This Zemio instance does not handle billing.",
		});
	}

	return {
		db: ctx.db,
		stripe: getStripe(),
		// Better Auth's URL is the deployment's own public origin, which is what
		// Stripe has to send the owner back to.
		appUrl: env.BETTER_AUTH_URL,
	};
}

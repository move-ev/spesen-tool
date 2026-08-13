import "server-only";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@zemio/db";
import type Stripe from "stripe";
import { CHECKOUT_RETURN_PATH } from "./billing.checkout";
import { billingRepository } from "./billing.repository";
import { withStripe } from "./billing.stripe";

/**
 * Managing an existing subscription, which Zemio does not do — Stripe's hosted
 * portal does. Payment methods, invoices, tier changes and cancellation all
 * live there, and none of them are rendered or stored here. That is most of
 * why hosted checkout was chosen in the first place.
 */

/** The slice of the Stripe client the portal uses. */
export type PortalStripeSource = {
	billingPortal: {
		sessions: Pick<Stripe.BillingPortal.SessionResource, "create">;
	};
};

export type PortalDependencies = {
	db: PrismaClient;
	stripe: PortalStripeSource;
	/** Where Stripe returns the owner to. */
	appUrl: string;
};

/**
 * Opens the hosted billing portal and returns where to send the owner.
 *
 * An organization with no customer has never reached checkout, so there is
 * nothing to manage. That is a state the interface should not have offered
 * this from, so it is reported as a precondition rather than an error — the
 * owner is told to start a subscription, not shown a failure.
 */
export async function openBillingPortal(
	deps: PortalDependencies,
	organizationId: string,
): Promise<{ url: string }> {
	const organization = await billingRepository.findOrganizationCustomer(
		deps.db,
		organizationId,
	);

	if (!organization) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "This organization no longer exists.",
		});
	}

	const customer = organization.stripeCustomerId;
	if (!customer) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "This organization has no subscription to manage yet.",
		});
	}

	const session = await withStripe("billingPortal.sessions.create", () =>
		deps.stripe.billingPortal.sessions.create({
			customer,
			return_url: `${deps.appUrl}${CHECKOUT_RETURN_PATH}`,
		}),
	);

	return { url: session.url };
}

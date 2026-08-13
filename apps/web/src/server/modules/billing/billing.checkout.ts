import "server-only";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@zemio/db";
import type Stripe from "stripe";
// Reached by its own path rather than the audit barrel, which pulls in
// audit.procedure and through it the tRPC root — a cycle back into this module
// via the entitlement gate.
import {
	CHECKOUT_RESULT,
	CHECKOUT_RESULT_PARAM,
	type CheckoutResult,
} from "@/lib/billing";
import { logger } from "@/lib/logger";
import { ROUTES } from "@/lib/routes";
import { auditRepository } from "@/server/modules/audit/audit.repository";
import { listTiers, type TierPriceSource } from "./billing.catalogue";
import { mayStartCheckout } from "./billing.policy";
import { billingRepository } from "./billing.repository";
import { withStripe } from "./billing.stripe";

/**
 * Starting a subscription: the one billing action a person performs rather
 * than one Stripe reports.
 */

/** The slice of the Stripe client checkout uses. */
export type CheckoutStripeSource = TierPriceSource & {
	customers: Pick<Stripe.CustomerResource, "create" | "del">;
	checkout: { sessions: Pick<Stripe.Checkout.SessionResource, "create"> };
};

export type CheckoutDependencies = {
	db: PrismaClient;
	stripe: CheckoutStripeSource;
	/** Where Stripe returns the owner to. */
	appUrl: string;
};

/** Who is committing the organization, for the audit trail. */
export type CheckoutActor = {
	organizationId: string;
	userId: string;
};

/**
 * Where an owner lands coming back from Stripe, and how they are told which
 * way it went.
 *
 * Both halves are shared with the billing page rather than spelled out here:
 * Stripe is handed these before the page reads them back, and a page at a
 * different route or reading a different parameter would leave a paying owner
 * on a 404 with no way to tell whether their payment took.
 */
export const CHECKOUT_RETURN_PATH = ROUTES.SETTINGS_ORG_BILLING();

function returnUrl(appUrl: string, result: CheckoutResult): string {
	return `${appUrl}${CHECKOUT_RETURN_PATH}?${CHECKOUT_RESULT_PARAM}=${CHECKOUT_RESULT[result]}`;
}

/**
 * Removes a customer created for a checkout that then lost the claim race.
 *
 * Left behind, it would carry the same `organizationId` metadata as the real
 * one — turning the single question that metadata exists to answer, "whose
 * customer is this?", into a guess between two, forever.
 *
 * Deliberately not through {@link withStripe}, which converts a provider failure
 * into a refusal for the caller to show. There is nothing to refuse here: the
 * customer this checkout will use is already settled, and the owner is waiting
 * on a purchase that has no reason to fail over housekeeping. An undeleted
 * customer is a support annoyance; a failed checkout is lost revenue. Logged
 * with both ids so it can be swept by hand.
 */
async function discardUnclaimedCustomer(
	deps: CheckoutDependencies,
	organizationId: string,
	customerId: string,
): Promise<void> {
	try {
		await deps.stripe.customers.del(customerId);
	} catch (error) {
		logger.error("Could not delete the customer a lost checkout race created", {
			organizationId,
			customerId,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

/**
 * Finds the Stripe customer this organization pays as, creating one if this is
 * its first checkout.
 *
 * Lazy by design: an organization that never subscribes never gets a customer.
 */
async function resolveCustomerId(
	deps: CheckoutDependencies,
	organizationId: string,
): Promise<string> {
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

	if (organization.stripeCustomerId) return organization.stripeCustomerId;

	const customer = await withStripe("customers.create", () =>
		deps.stripe.customers.create({
			name: organization.name,
			// Written on the customer as well as the session so the link between
			// organization and customer is recoverable from either side.
			metadata: { organizationId },
		}),
	);

	const claimed = await billingRepository.claimStripeCustomer(
		deps.db,
		organizationId,
		customer.id,
	);

	if (claimed) return customer.id;

	// A concurrent first checkout got there first. Its customer is the one the
	// organization pays as, and the one this session must use — the customer
	// just created is discarded rather than given a subscription no organization
	// would claim. Discarded before the read-back, because the read-back has a
	// failing path of its own and this customer is unused either way.
	await discardUnclaimedCustomer(deps, organizationId, customer.id);

	const current = await billingRepository.findOrganizationCustomer(
		deps.db,
		organizationId,
	);

	if (!current?.stripeCustomerId) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Could not set this organization up for billing.",
		});
	}

	return current.stripeCustomerId;
}

/**
 * Starts a hosted checkout for a tier and returns where to send the owner.
 *
 * The price is checked against the catalogue rather than taken on trust: it
 * arrives from the client, and only a price Stripe carries Zemio tier metadata
 * on is a tier anyone may subscribe to.
 *
 * Nothing about the subscription is written here. Zemio learns the outcome from
 * the webhook, so abandoning checkout leaves the organization exactly as it
 * was — bar the customer, which is reused by the next attempt.
 */
export async function startCheckout(
	deps: CheckoutDependencies,
	actor: CheckoutActor,
	priceId: string,
): Promise<{ url: string }> {
	// Scoped to the acting organization, and deliberately the same list the page
	// offered: a price negotiated for someone else is not a tier this
	// organization may buy, and checking against the unscoped catalogue would
	// make the page's discretion cosmetic.
	const tier = (await listTiers(deps.stripe, actor.organizationId)).find(
		(candidate) => candidate.priceId === priceId,
	);

	if (!tier) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "That tier is not available.",
		});
	}

	// The interface hides the tier list from an organization that already
	// subscribes, but hiding is presentation: a stale tab, a double submit or a
	// direct call would otherwise buy a second Stripe subscription against the
	// same customer, which Stripe bills and Zemio cannot record.
	const organization = await billingRepository.findOrganizationBilling(
		deps.db,
		actor.organizationId,
	);

	if (!mayStartCheckout(organization?.subscription ?? null)) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message:
				"This organization already has a subscription. Change it in the billing portal.",
		});
	}

	const customerId = await resolveCustomerId(deps, actor.organizationId);

	const session = await withStripe("checkout.sessions.create", () =>
		deps.stripe.checkout.sessions.create({
			mode: "subscription",
			customer: customerId,
			client_reference_id: actor.organizationId,
			line_items: [{ price: priceId, quantity: 1 }],
			// Also on the subscription itself, so support can answer "whose is
			// this?" from the subscription alone rather than following it to its
			// customer.
			subscription_data: {
				metadata: { organizationId: actor.organizationId },
			},
			success_url: returnUrl(deps.appUrl, "complete"),
			cancel_url: returnUrl(deps.appUrl, "cancelled"),
		}),
	);

	if (!session.url) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "The billing provider returned no checkout page.",
		});
	}

	// Recorded after the session exists, so an owner is never shown as having
	// started something that failed to start. The action is the checkout, not
	// the subscription — whether it completes is Stripe's to report (ADR-0007).
	await auditRepository.append(deps.db, {
		organizationId: actor.organizationId,
		actorId: actor.userId,
		entityType: "organization",
		entityId: actor.organizationId,
		action: "billing.checkout_started",
		diff: null,
		payload: { tier: tier.name, priceId, seatLimit: tier.seatLimit },
	});

	return { url: session.url };
}

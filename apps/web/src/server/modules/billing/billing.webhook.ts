import "server-only";
import type { PrismaClient } from "@zemio/db";
import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import { isUniqueConstraintError } from "@/server/shared/errors";
import { tierFromPrice } from "./billing.catalogue";
import { billingRepository } from "./billing.repository";

/**
 * Keeping Zemio's copy of a subscription in step with Stripe.
 *
 * The event is treated as a signal that something changed, never as a claim
 * about what it changed to: the subscription is re-fetched from the API before
 * anything is written (ADR-0004). That is what makes out-of-order delivery
 * harmless, and it is not an extra call to optimise away.
 */

/** The slice of the Stripe client the webhook uses. */
export type WebhookStripeSource = {
	subscriptions: Pick<Stripe.SubscriptionResource, "retrieve">;
};

export type WebhookDependencies = {
	db: PrismaClient;
	stripe: WebhookStripeSource;
};

/**
 * What became of an event.
 *
 * `ignored` is a success: an event Zemio has no use for, and one about a
 * customer it does not know, are both ordinary. Only a genuine failure throws,
 * because a throw is what asks Stripe to redeliver.
 */
export type WebhookOutcome = "processed" | "duplicate" | "ignored";

/** Stripe hands back either the id or the expanded object; we only want the id. */
function idOf(
	value: string | { id: string } | null | undefined,
): string | null {
	if (!value) return null;
	return typeof value === "string" ? value : value.id;
}

/**
 * The subscription this event is about, without reading its state — and the
 * one place that decides which events Zemio acts on at all.
 *
 * A checkout session names its subscription; the subscription events are about
 * themselves. Anything else, and a session that started no subscription
 * because its mode was not `subscription`, names none: there is nothing to do.
 */
function subscriptionIdFrom(event: Stripe.Event): string | null {
	switch (event.type) {
		case "checkout.session.completed":
			return idOf(event.data.object.subscription);
		case "customer.subscription.created":
		case "customer.subscription.updated":
		case "customer.subscription.deleted":
			return event.data.object.id;
		default:
			return null;
	}
}

/**
 * Handles a verified Stripe event.
 *
 * The event id is recorded before the event is acted on, so a redelivery —
 * which Stripe does aggressively on any non-2xx response — is a no-op rather
 * than a second application (ADR-0004).
 */
export async function handleStripeEvent(
	deps: WebhookDependencies,
	event: Stripe.Event,
): Promise<WebhookOutcome> {
	try {
		// Every event is claimed, not just the four acted on, so the table grows
		// with the whole Stripe event volume — one paid checkout leaves around
		// thirty rows. That is accepted: filtering first would save rows at the
		// cost of the claim no longer being the very first thing that happens.
		await billingRepository.recordStripeEvent(deps.db, event.id, event.type);
	} catch (error) {
		if (isUniqueConstraintError(error)) return "duplicate";
		throw error;
	}

	try {
		return await applyEvent(deps, event);
	} catch (error) {
		// The claim is released before the failure is re-thrown. Recording first
		// is what makes a redelivery arriving *during* processing a no-op
		// (ADR-0004); leaving the record behind after processing failed would
		// make Stripe's redelivery a no-op too, and the change would be lost for
		// good with nothing left to retry it.
		await billingRepository
			.forgetStripeEvent(deps.db, event.id)
			.catch((cleanupError) => {
				logger.error("Could not release a failed Stripe event", {
					eventId: event.id,
					error:
						cleanupError instanceof Error
							? cleanupError.message
							: String(cleanupError),
				});
			});
		throw error;
	}
}

/** Everything the event means, once its id is claimed. */
async function applyEvent(
	deps: WebhookDependencies,
	event: Stripe.Event,
): Promise<WebhookOutcome> {
	const subscriptionId = subscriptionIdFrom(event);
	if (!subscriptionId) return "ignored";

	// The re-fetch. See ADR-0004 before removing it.
	const subscription = await deps.stripe.subscriptions.retrieve(subscriptionId);

	const customerId = idOf(subscription.customer);
	const organizationId = customerId
		? await billingRepository.findOrganizationIdByStripeCustomer(
				deps.db,
				customerId,
			)
		: null;

	// A customer Zemio does not know is not an error: the same Stripe account
	// may serve another environment, and a deleted organization leaves its
	// customer behind.
	if (!organizationId) {
		logger.warn("Stripe event for an unrecognised customer", {
			eventId: event.id,
			customerId,
		});
		return "ignored";
	}

	const items = subscription.items.data;
	// The tier is whichever item carries tier metadata, not whichever Stripe
	// happens to list first — item order is not guaranteed, and a subscription
	// may carry something alongside its tier. Falling back to the first item
	// keeps the status of a subscription that has no tiered item at all.
	const item =
		items.find((candidate) => tierFromPrice(candidate.price)) ?? items[0];
	if (!item) {
		logger.error("Stripe subscription has no items", {
			eventId: event.id,
			subscriptionId,
		});
		return "ignored";
	}

	const facts = {
		stripeSubscriptionId: subscription.id,
		stripePriceId: item.price.id,
		status: subscription.status,
		// The period end is the item's in the API version this SDK pins, and
		// Stripe counts in seconds.
		currentPeriodEnd: new Date(item.current_period_end * 1000),
		cancelAtPeriodEnd: subscription.cancel_at_period_end,
	};

	const tier = tierFromPrice(item.price);

	// An untagged price means someone subscribed an organization to a price
	// that was never set up as a tier. Zemio will not invent commercial terms
	// (ADR-0003): the status still moves, and whatever tier is on record stays.
	if (!tier) {
		const updated = await billingRepository.updateSubscriptionIfPresent(
			deps.db,
			organizationId,
			facts,
		);

		logger.error("Stripe price carries no Zemio tier metadata", {
			eventId: event.id,
			priceId: item.price.id,
			organizationId,
			updated,
		});

		return updated > 0 ? "processed" : "ignored";
	}

	await billingRepository.upsertSubscription(deps.db, organizationId, {
		...facts,
		tier: tier.name,
		seatLimit: tier.seatLimit,
	});

	return "processed";
}

import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { billingConfig } from "@/server/modules/billing/billing.config";
import { getStripe } from "@/server/modules/billing/billing.stripe";
import { handleStripeEvent } from "@/server/modules/billing/billing.webhook";

/**
 * Stripe's webhook endpoint.
 *
 * Outside tRPC because signature verification needs the raw request body. A
 * thin adapter on purpose: verify, delegate, answer. Every decision about what
 * an event means belongs to `handleStripeEvent`.
 */
export async function POST(request: Request): Promise<Response> {
	// An instance that does not bill has no webhook to offer, and answering
	// anything else would advertise an endpoint it cannot verify against.
	if (!billingConfig.enabled) {
		return new Response("Not found", { status: 404 });
	}

	const signature = request.headers.get("stripe-signature");
	if (!signature) {
		return new Response("Missing signature", { status: 400 });
	}

	const body = await request.text();

	let event: Stripe.Event;
	try {
		event = await getStripe().webhooks.constructEventAsync(
			body,
			signature,
			billingConfig.webhookSecret,
		);
	} catch (error) {
		// Unverified: this did not come from Stripe, or the secret is wrong.
		// Either way nothing is read or written, and a 400 stops Stripe retrying
		// something a retry cannot fix.
		logger.warn("Rejected an unverified Stripe webhook", {
			error: error instanceof Error ? error.message : String(error),
		});
		return new Response("Invalid signature", { status: 400 });
	}

	// A throw here answers 500, which is Stripe's cue to redeliver.
	const outcome = await handleStripeEvent({ db, stripe: getStripe() }, event);

	return Response.json({ received: true, outcome });
}

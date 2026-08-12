import "server-only";
import Stripe from "stripe";
import { billingConfig } from "./billing.config";

let client: Stripe | null = null;

/**
 * The Stripe client, constructed once on first use.
 *
 * Not on the tRPC context: procedures reach for it and pass it into service
 * functions explicitly, which keeps the shared context and the test utilities
 * free of billing. Callers must have established that billing is on — the
 * throw is for a caller that skipped that check, not a state to handle.
 */
export function getStripe(): Stripe {
	if (!billingConfig.enabled) {
		throw new Error(
			"The billing provider client was requested while billing is switched off.",
		);
	}

	client ??= new Stripe(billingConfig.secretKey);
	return client;
}

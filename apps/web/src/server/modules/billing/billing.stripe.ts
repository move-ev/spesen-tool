import "server-only";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { logger } from "@/lib/logger";
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

/**
 * Runs a Stripe call, keeping the provider's own words out of the browser.
 *
 * tRPC copies a thrown error's message onto the wire, and the billing page puts
 * that straight into a toast — so an unsaved portal configuration reached an
 * owner as a paragraph of Stripe dashboard instructions, and a bad key reached
 * them as a bad-key message. The real error is logged with the operation that
 * raised it; the caller gets one sentence it can act on.
 *
 * The same boundary {@link mapPrismaError} draws for the database, drawn for
 * the one other service that talks to something outside Zemio.
 */
export async function withStripe<T>(
	operation: string,
	call: () => Promise<T>,
): Promise<T> {
	try {
		return await call();
	} catch (error) {
		// A refusal we raised ourselves is already the message we meant to send.
		if (error instanceof TRPCError) throw error;

		logger.error("The billing provider rejected a call", {
			operation,
			error: error instanceof Error ? error.message : String(error),
		});

		throw new TRPCError({
			code: "BAD_GATEWAY",
			message: "The billing provider could not be reached. Please try again.",
		});
	}
}

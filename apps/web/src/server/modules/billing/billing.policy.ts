/**
 * The rules that decide whether an organization may create new work.
 *
 * Pure functions, deliberately: this is the logic that either locks out a
 * paying customer or gives the product away, and it needs to be testable
 * without a database, a network, or a Stripe account.
 */

/**
 * What billing says about an organization right now.
 *
 * `payment_failing` is entitled — it exists so the interface can warn without
 * the rest of the code having to know which Stripe statuses are worrying.
 */
export type EntitlementState = "entitled" | "payment_failing" | "read_only";

/** The only subscription facts an entitlement decision reads. */
export type SubscriptionFacts = {
	status: string;
	seatLimit: number;
};

export type EntitlementInput = {
	/** The deployment-wide flag. */
	billingEnabled: boolean;
	/** The organization's own enforcement override, read beneath the flag. */
	enforcedForOrganization: boolean;
	subscription: SubscriptionFacts | null;
};

/**
 * Maps a Stripe subscription status to what Zemio does about it.
 *
 * Every status Stripe documents today is named here, including the ones the
 * spec did not call out. Falling open is the right answer for a word we have
 * never seen; it is the wrong answer for `incomplete_expired`, which means the
 * very first payment never completed and never will.
 */
export function entitlementFromStripeStatus(status: string): EntitlementState {
	switch (status) {
		case "active":
		case "trialing":
			return "entitled";

		// Stripe is still retrying the card. A payment that failed on a Friday
		// should not cost the organization its working week.
		case "past_due":
			return "payment_failing";

		// The first payment has not gone through — typically an SCA challenge
		// the customer has not completed. Still completable, so warn rather than
		// refuse; it becomes `incomplete_expired` if they never finish.
		case "incomplete":
			return "payment_failing";

		// Terminal, and never paid: the initial payment expired uncompleted.
		case "incomplete_expired":
		case "canceled":
		case "unpaid":
			return "read_only";

		// Not "pausing collection", which leaves the status untouched. Stripe only
		// reports `paused` when a trial ended without a payment method: no
		// invoices are raised and Stripe will not move the subscription on by
		// itself. Entitled, because nobody should be locked out of a state the
		// operator arranged — but never silently, or an organization uses Zemio
		// indefinitely with nothing to pay against and no one told. The banner
		// asks for the card, which is exactly what resuming needs.
		case "paused":
			return "payment_failing";

		default:
			return "entitled";
	}
}

/**
 * Resolves an organization's entitlement from the two enforcement switches and
 * its subscription.
 *
 * Both switches must be on before anything can be refused (ADR-0001). With
 * either off — a self-hoster, or a customer not yet rolled out to — every
 * organization is entitled regardless of what Stripe says.
 */
export function resolveEntitlement(input: EntitlementInput): EntitlementState {
	if (!input.billingEnabled || !input.enforcedForOrganization) {
		return "entitled";
	}

	if (!input.subscription) {
		return "read_only";
	}

	return entitlementFromStripeStatus(input.subscription.status);
}

/** Whether new work may be created. Only `read_only` refuses. */
export function isEntitled(state: EntitlementState): boolean {
	return state !== "read_only";
}

/**
 * Whether an organization may start a hosted checkout.
 *
 * Zemio keeps one subscription row per organization, so a second live
 * subscription would be billed by Stripe and not recorded here — and cancelling
 * either one would then write a terminal status over an organization that is
 * still paying. A subscription Stripe still considers live is therefore changed
 * in the portal, never bought again.
 *
 * Read from the subscription's own status rather than from the resolved
 * entitlement, which would answer "entitled" for an organization enforcement
 * does not apply to and refuse it a subscription it is entitled to buy.
 */
export function mayStartCheckout(
	subscription: SubscriptionFacts | null,
): boolean {
	if (!subscription) return true;

	// A lapsed organization must keep this route open: billing is deliberately
	// ungated so the one action that fixes it stays reachable (ADR-0006).
	return !isEntitled(entitlementFromStripeStatus(subscription.status));
}

/**
 * Whether an organization has more members than its tier includes.
 *
 * Reported, never enforced: members are created automatically when a Microsoft
 * tenant matches, so an organization can cross its limit through nobody's
 * action (ADR-0005). Deliberately not an input to `resolveEntitlement`.
 */
export function isOverSeatLimit(
	seatCount: number,
	seatLimit: number | null,
): boolean {
	return seatLimit !== null && seatCount > seatLimit;
}

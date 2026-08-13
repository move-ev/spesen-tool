/**
 * How Stripe tells the billing page which way a checkout went.
 *
 * Shared rather than server-only on purpose: the checkout service hands these
 * to Stripe, and the billing page reads them back off the URL, so both sides
 * need them. Nothing here is configuration — no secret, no account, nothing
 * that says whether this deployment bills at all.
 *
 * The path an owner returns to is {@link ROUTES.SETTINGS_ORG_BILLING}, so the
 * route and the page cannot drift apart either.
 */
export const CHECKOUT_RESULT_PARAM = "checkout";

export const CHECKOUT_RESULT = {
	complete: "complete",
	cancelled: "cancelled",
} as const;

export type CheckoutResult = keyof typeof CHECKOUT_RESULT;

/**
 * Which banner an organization's billing state calls for, if any.
 *
 * A pure function beside the checkout constants rather than in the component,
 * for the same reason the entitlement rules are pure: this decides whether
 * every member of an organization is shown an alarming message, and getting it
 * wrong in either direction — crying wolf, or staying silent while people are
 * refused — is worth testing without rendering anything.
 */
export type BillingBannerKind =
	| "read_only"
	| "payment_failing"
	| "over_seat_limit";

/**
 * The slice of the billing status a banner decision reads.
 *
 * Structural rather than the whole status, so this file needs nothing from the
 * server module and the browser is handed no billing configuration.
 */
export type BannerStatus =
	| { enabled: false }
	| {
			enabled: true;
			enforced: boolean;
			state: "entitled" | "payment_failing" | "read_only";
			overSeatLimit: boolean;
	  };

export function resolveBillingBanner(
	status: BannerStatus,
): BillingBannerKind | null {
	// Both switches, the same pair the entitlement rules read: a deployment that
	// does not bill, and an organization not yet rolled out to, are both states
	// where nothing is being enforced and so nothing needs saying (ADR-0001).
	if (!status.enabled || !status.enforced) {
		return null;
	}

	// Most consequential first, one banner at a time. Being unable to create
	// work outranks a seat count, and a failing payment outranks it too — it is
	// the one an owner can still act on before it becomes the former.
	if (status.state === "read_only") return "read_only";
	if (status.state === "payment_failing") return "payment_failing";

	// Advisory only, and deliberately last: nothing is refused over seats
	// (ADR-0005).
	return status.overSeatLimit ? "over_seat_limit" : null;
}

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

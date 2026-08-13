import { z } from "zod";

/**
 * Server-only input schemas for the billing router.
 *
 * There is exactly one, because billing takes almost nothing from the client:
 * tiers, amounts and seat limits are Stripe's (ADR-0003), and the portal takes
 * no input at all. It lives here rather than inline in the router so the next
 * billing input has an obvious home, and so this module keeps the shape every
 * other server module has.
 *
 * Unlike the report and expense schemas there is no counterpart in
 * `@/lib/validators`: no form validates against this, so there is no second
 * contract to keep in step.
 */

/**
 * Which tier to buy.
 *
 * A non-empty string is the whole check worth doing here — whether the price is
 * one Zemio actually sells is a question only the Stripe catalogue can answer,
 * and `startCheckout` asks it before creating a session.
 */
export const startCheckoutInputSchema = z.object({
	priceId: z.string().min(1),
});

export type StartCheckoutInput = z.infer<typeof startCheckoutInputSchema>;

import "server-only";
import type Stripe from "stripe";

/**
 * The catalogue of tiers an organization can buy, read from Stripe.
 *
 * Nothing here names a tier, an amount or a seat count. Tiers are whatever
 * Stripe prices say they are, which is what lets a negotiated XL deal be
 * provisioned by creating a price in the dashboard rather than by a deploy
 * (ADR-0003).
 */

/** The price metadata keys that mark a Stripe price as a Zemio tier. */
const TIER_KEY = "zemio_tier";
const SEATS_KEY = "zemio_seats";

/** A tier as the product displays it. Every field comes from Stripe. */
export type Tier = {
	priceId: string;
	/** The tier's name as the dashboard spells it — `M`, or a negotiated `XL`. */
	name: string;
	seatLimit: number;
	/** In the currency's minor unit, as Stripe reports it. */
	amount: number;
	currency: string;
	/** The billing interval, e.g. `month` or `year`. */
	interval: string;
};

/**
 * The slice of the Stripe client the catalogue uses.
 *
 * Narrow on purpose: the tests supply a stub rather than a Stripe instance,
 * and the catalogue cannot quietly grow a dependency on the rest of the API.
 */
export type TierPriceSource = {
	prices: Pick<Stripe.PriceResource, "list">;
};

/** Whole, positive seat counts only — anything else is a misconfigured price. */
function parseSeatLimit(value: string | undefined): number | null {
	if (value === undefined || value.trim() === "") return null;
	const seats = Number(value);
	return Number.isInteger(seats) && seats > 0 ? seats : null;
}

/**
 * Reads a tier off a Stripe price, or `null` if the price is not one.
 *
 * A price that fails any of these checks is skipped rather than reported: the
 * Stripe account holds prices that have nothing to do with tiers, and a
 * half-tagged price is a mistake in the dashboard, not something to show a
 * customer as a broken tier.
 */
export function tierFromPrice(price: Stripe.Price): Tier | null {
	const name = price.metadata?.[TIER_KEY]?.trim();
	if (!name) return null;

	const seatLimit = parseSeatLimit(price.metadata?.[SEATS_KEY]);
	if (seatLimit === null) return null;

	// A tiered or metered price has no single amount to display, and a one-off
	// price cannot carry a subscription.
	if (price.unit_amount === null) return null;
	if (!price.recurring) return null;

	return {
		priceId: price.id,
		name,
		seatLimit,
		amount: price.unit_amount,
		currency: price.currency,
		interval: price.recurring.interval,
	};
}

/**
 * How long a read of the catalogue is reused.
 *
 * The catalogue is read on page loads and changes a few times a year, so a
 * short window removes almost every Stripe call while keeping a dashboard
 * price change visible within minutes rather than needing a restart.
 */
export const TIER_CACHE_TTL_MS = 5 * 60 * 1000;

let cached: { tiers: Tier[]; expiresAt: number } | null = null;

/** Drops the cached catalogue, so one test's read cannot serve the next. */
export function clearTierCatalogue(): void {
	cached = null;
}

async function fetchTiers(stripe: TierPriceSource): Promise<Tier[]> {
	const tiers: Tier[] = [];
	let startingAfter: string | undefined;

	// Paged rather than capped: every negotiated XL deal adds a price, so the
	// number of prices grows with the customer base and a single page would
	// silently start dropping tiers.
	while (true) {
		const page = await stripe.prices.list({
			active: true,
			limit: 100,
			...(startingAfter ? { starting_after: startingAfter } : {}),
		});

		for (const price of page.data) {
			const tier = tierFromPrice(price);
			if (tier) tiers.push(tier);
		}

		const last = page.data.at(-1);
		if (!page.has_more || !last) break;
		startingAfter = last.id;
	}

	// Cheapest first, so a tier added in the dashboard lands in its place
	// without anything in Zemio knowing the order tiers are meant to come in.
	return tiers.sort((a, b) => a.amount - b.amount);
}

/**
 * The tiers on offer, cached process-wide.
 *
 * The catalogue takes no organization: what tiers exist is the same question
 * for everyone, so there is nothing organization-specific to key a cache on
 * and nothing that could be served to the wrong organization. A failed read
 * caches nothing, so a Stripe outage does not turn into an empty pricing page
 * for the length of the window.
 */
export async function listTiers(stripe: TierPriceSource): Promise<Tier[]> {
	if (!cached || cached.expiresAt <= Date.now()) {
		const tiers = await fetchTiers(stripe);
		cached = { tiers, expiresAt: Date.now() + TIER_CACHE_TTL_MS };
	}

	// Copied down to the tier, not just the array: a caller adjusting a tier it
	// was handed must not rewrite the price every later caller reads.
	return cached.tiers.map((tier) => ({ ...tier }));
}

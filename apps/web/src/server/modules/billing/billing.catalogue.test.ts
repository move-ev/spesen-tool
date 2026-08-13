import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearTierCatalogue,
	listTiers,
	TIER_CACHE_TTL_MS,
	type TierPriceSource,
	tierFromPrice,
} from "./billing.catalogue";

/** The organization asking, for the tiers it is offered. */
const ORG = "org_1";

/** A Stripe price as the catalogue reads it, with everything valid by default. */
function price(overrides: Record<string, unknown> = {}) {
	return {
		id: "price_1",
		active: true,
		currency: "eur",
		unit_amount: 1900,
		recurring: { interval: "month", interval_count: 1 },
		metadata: { zemio_tier: "M", zemio_seats: "25" },
		...overrides,
	};
}

/** A Stripe client stub serving the given pages of prices, in order. */
function stripeWith(...pages: unknown[][]): TierPriceSource & {
	list: ReturnType<typeof vi.fn>;
} {
	const list = vi.fn();
	for (const [index, prices] of pages.entries()) {
		const has_more = index < pages.length - 1;
		list.mockResolvedValueOnce({ data: prices, has_more });
	}
	// Every page has been served; a further call would be a bug in the caller.
	list.mockResolvedValue({ data: [], has_more: false });
	return { prices: { list } as unknown as TierPriceSource["prices"], list };
}

beforeEach(() => {
	clearTierCatalogue();
});

describe("tierFromPrice", () => {
	it("reads the tier, seats and amount off a price", () => {
		expect(tierFromPrice(price() as never)).toEqual({
			priceId: "price_1",
			name: "M",
			seatLimit: 25,
			amount: 1900,
			currency: "eur",
			interval: "month",
		});
	});

	it("ignores a price carrying no Zemio metadata", () => {
		expect(tierFromPrice(price({ metadata: {} }) as never)).toBeNull();
	});

	it("ignores a price naming a tier but no seat count", () => {
		expect(
			tierFromPrice(price({ metadata: { zemio_tier: "M" } }) as never),
		).toBeNull();
	});

	it("ignores a seat count that is not a whole positive number", () => {
		for (const zemio_seats of ["", "lots", "0", "-5", "2.5"]) {
			expect(
				tierFromPrice(
					price({ metadata: { zemio_tier: "M", zemio_seats } }) as never,
				),
			).toBeNull();
		}
	});

	it("ignores a seat count too large for the subscription record to hold", () => {
		// `Subscription.seatLimit` is a Postgres INTEGER. Accepting more here
		// would sell the tier and only then fail on the webhook's write, leaving
		// an organization that has paid with no subscription at all.
		expect(
			tierFromPrice(
				price({
					metadata: { zemio_tier: "XL", zemio_seats: "9999999999" },
				}) as never,
			),
		).toBeNull();
	});

	it("keeps the largest seat count that still fits", () => {
		expect(
			tierFromPrice(
				price({
					metadata: { zemio_tier: "XL", zemio_seats: "2147483647" },
				}) as never,
			),
		).toMatchObject({ seatLimit: 2_147_483_647 });
	});

	it("ignores a price with no amount, since nothing can be displayed for it", () => {
		expect(tierFromPrice(price({ unit_amount: null }) as never)).toBeNull();
	});

	it("ignores a one-off price, since a subscription cannot be started from it", () => {
		expect(tierFromPrice(price({ recurring: null }) as never)).toBeNull();
	});

	it("accepts a tier name and seat count it has never seen before", () => {
		expect(
			tierFromPrice(
				price({
					id: "price_xl_acme",
					unit_amount: 249_00,
					metadata: { zemio_tier: "XL Acme", zemio_seats: "400" },
				}) as never,
			),
		).toMatchObject({ name: "XL Acme", seatLimit: 400, amount: 24_900 });
	});
});

describe("listTiers", () => {
	it("lists only the prices carrying Zemio metadata", async () => {
		const stripe = stripeWith([
			price({
				id: "price_s",
				unit_amount: 900,
				metadata: { zemio_tier: "S", zemio_seats: "10" },
			}),
			price({ id: "price_unrelated", metadata: { some_other_product: "yes" } }),
		]);

		await expect(listTiers(stripe, ORG)).resolves.toEqual([
			{
				priceId: "price_s",
				name: "S",
				seatLimit: 10,
				amount: 900,
				currency: "eur",
				interval: "month",
			},
		]);
	});

	it("orders tiers by amount, so a tier added later lands in its place", async () => {
		const stripe = stripeWith([
			price({
				id: "price_l",
				unit_amount: 4900,
				metadata: { zemio_tier: "L", zemio_seats: "50" },
			}),
			price({
				id: "price_s",
				unit_amount: 900,
				metadata: { zemio_tier: "S", zemio_seats: "10" },
			}),
			price({
				id: "price_m",
				unit_amount: 1900,
				metadata: { zemio_tier: "M", zemio_seats: "25" },
			}),
		]);

		const tiers = await listTiers(stripe, ORG);

		expect(tiers.map((t) => t.name)).toEqual(["S", "M", "L"]);
	});

	it("requests only active prices", async () => {
		const stripe = stripeWith([price()]);

		await listTiers(stripe, ORG);

		expect(stripe.list).toHaveBeenCalledWith(
			expect.objectContaining({ active: true }),
		);
	});

	it("follows pagination, so a catalogue past one page is complete", async () => {
		const stripe = stripeWith(
			[
				price({
					id: "price_s",
					unit_amount: 900,
					metadata: { zemio_tier: "S", zemio_seats: "10" },
				}),
			],
			[price({ id: "price_m" })],
		);

		const tiers = await listTiers(stripe, ORG);

		expect(tiers.map((t) => t.name)).toEqual(["S", "M"]);
		expect(stripe.list).toHaveBeenLastCalledWith(
			expect.objectContaining({ starting_after: "price_s" }),
		);
	});

	it("returns an empty catalogue rather than throwing when no price is tagged", async () => {
		const stripe = stripeWith([price({ metadata: {} })]);

		await expect(listTiers(stripe, ORG)).resolves.toEqual([]);
	});
});

describe("listTiers caching", () => {
	it("reads Stripe once across repeated calls", async () => {
		const stripe = stripeWith([price()]);

		await listTiers(stripe, ORG);
		await listTiers(stripe, ORG);

		expect(stripe.list).toHaveBeenCalledTimes(1);
	});

	it("serves the same catalogue whichever organization asks, since it has none", async () => {
		const stripe = stripeWith([price()]);

		const first = await listTiers(stripe, ORG);
		const second = await listTiers(stripe, ORG);

		expect(second).toEqual(first);
	});

	it("hands out a copy, so one caller cannot corrupt another's catalogue", async () => {
		const stripe = stripeWith([price()]);

		const first = await listTiers(stripe, ORG);
		first.pop();

		await expect(listTiers(stripe, ORG)).resolves.toHaveLength(1);
	});

	it("hands out copies of the tiers themselves, not the cached ones", async () => {
		const stripe = stripeWith([price()]);

		const [tier] = await listTiers(stripe, ORG);
		if (tier) tier.amount = 1;

		await expect(listTiers(stripe, ORG)).resolves.toMatchObject([
			{ amount: 1900 },
		]);
	});

	it("reads Stripe again once the cached catalogue has aged out", async () => {
		vi.useFakeTimers();
		try {
			const stripe = stripeWith([price()]);

			await listTiers(stripe, ORG);
			vi.advanceTimersByTime(TIER_CACHE_TTL_MS + 1);
			await listTiers(stripe, ORG);

			expect(stripe.list).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
		}
	});

	it("reads Stripe once for a burst of callers, not once per caller", async () => {
		// A burst is what an expiring window produces: every page load in flight
		// finds no cache and, unless they share one read, each walks Stripe's
		// pages itself and overwrites the answer the others just wrote.
		const stripe = stripeWith([price()]);

		const [first, second, third] = await Promise.all([
			listTiers(stripe, ORG),
			listTiers(stripe, ORG),
			listTiers(stripe, ORG),
		]);

		expect(stripe.list).toHaveBeenCalledTimes(1);
		expect(second).toEqual(first);
		expect(third).toEqual(first);
	});

	it("lets go of a failed read, so the caller after it is not handed the failure", async () => {
		const list = vi
			.fn()
			.mockRejectedValueOnce(new Error("stripe is down"))
			.mockResolvedValueOnce({ data: [price()], has_more: false });
		const stripe = { prices: { list } } as unknown as TierPriceSource;

		// The burst shares the outage, since it is the one read that failed.
		await expect(
			Promise.all([listTiers(stripe, ORG), listTiers(stripe, ORG)]),
		).rejects.toThrow();

		await expect(listTiers(stripe, ORG)).resolves.toHaveLength(1);
		expect(list).toHaveBeenCalledTimes(2);
	});

	it("caches nothing when the read fails, so a Stripe outage is not sticky", async () => {
		const list = vi
			.fn()
			.mockRejectedValueOnce(new Error("stripe is down"))
			.mockResolvedValueOnce({ data: [price()], has_more: false });
		const stripe = { prices: { list } } as unknown as TierPriceSource;

		await expect(listTiers(stripe, ORG)).rejects.toThrow();

		await expect(listTiers(stripe, ORG)).resolves.toHaveLength(1);
	});

	it("reports a failed read without repeating what Stripe said", async () => {
		// The message travels to the browser and into a toast, so it says what the
		// reader can do, not what Stripe told the server.
		const list = vi
			.fn()
			.mockRejectedValue(
				new Error("Invalid API Key provided: sk_test_51****abcd"),
			);
		const stripe = { prices: { list } } as unknown as TierPriceSource;

		await expect(listTiers(stripe, ORG)).rejects.toThrow(
			"The billing provider could not be reached. Please try again.",
		);
	});
});

describe("tierFromPrice interval", () => {
	it("skips a price billed over more than one interval", () => {
		// €60 every three months is not €60 a month. The page shows one amount
		// against one interval, so a price it cannot state plainly is withheld
		// rather than advertised at a third of its real cost.
		expect(
			tierFromPrice(
				price({ recurring: { interval: "month", interval_count: 3 } }) as never,
			),
		).toBeNull();
	});

	it("keeps an ordinary monthly price", () => {
		expect(
			tierFromPrice(
				price({ recurring: { interval: "month", interval_count: 1 } }) as never,
			),
		).not.toBeNull();
	});
});

describe("listTiers scoping", () => {
	/** A negotiated price, tagged for the one organization it was agreed with. */
	function negotiated(organizationId: string) {
		return price({
			id: "price_xl_acme",
			unit_amount: 249_00,
			metadata: {
				zemio_tier: "XL Acme",
				zemio_seats: "400",
				zemio_org: organizationId,
			},
		});
	}

	it("offers a published tier to every organization", async () => {
		const stripe = stripeWith([price()]);

		await expect(listTiers(stripe, "org_1")).resolves.toHaveLength(1);
	});

	it("offers a negotiated tier to the organization it was negotiated for", async () => {
		const stripe = stripeWith([price(), negotiated("org_1")]);

		const tiers = await listTiers(stripe, "org_1");

		expect(tiers.map((t) => t.name)).toEqual(["M", "XL Acme"]);
	});

	it("hides a negotiated tier from every other organization", async () => {
		// Commercially confidential, and the catalogue is also the allowlist
		// checkout validates against — so being listed is being purchasable.
		const stripe = stripeWith([price(), negotiated("org_1")]);

		const tiers = await listTiers(stripe, "org_2");

		expect(tiers.map((t) => t.name)).toEqual(["M"]);
	});

	it("tells no organization who a deal belongs to", async () => {
		const stripe = stripeWith([negotiated("org_1")]);

		const tiers = await listTiers(stripe, "org_1");

		expect(JSON.stringify(tiers)).not.toContain("org_1");
	});

	it("reads Stripe once and scopes per caller, so one cache serves both", async () => {
		const stripe = stripeWith([price(), negotiated("org_1")]);

		await expect(listTiers(stripe, "org_1")).resolves.toHaveLength(2);
		await expect(listTiers(stripe, "org_2")).resolves.toHaveLength(1);

		expect(stripe.list).toHaveBeenCalledTimes(1);
	});

	it("treats a blank organization tag as a published tier", async () => {
		const stripe = stripeWith([negotiated("   ")]);

		await expect(listTiers(stripe, "org_2")).resolves.toHaveLength(1);
	});
});

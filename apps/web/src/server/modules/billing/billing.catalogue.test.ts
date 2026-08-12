import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearTierCatalogue,
	listTiers,
	TIER_CACHE_TTL_MS,
	type TierPriceSource,
	tierFromPrice,
} from "./billing.catalogue";

/** A Stripe price as the catalogue reads it, with everything valid by default. */
function price(overrides: Record<string, unknown> = {}) {
	return {
		id: "price_1",
		active: true,
		currency: "eur",
		unit_amount: 1900,
		recurring: { interval: "month" },
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

		await expect(listTiers(stripe)).resolves.toEqual([
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

		const tiers = await listTiers(stripe);

		expect(tiers.map((t) => t.name)).toEqual(["S", "M", "L"]);
	});

	it("requests only active prices", async () => {
		const stripe = stripeWith([price()]);

		await listTiers(stripe);

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

		const tiers = await listTiers(stripe);

		expect(tiers.map((t) => t.name)).toEqual(["S", "M"]);
		expect(stripe.list).toHaveBeenLastCalledWith(
			expect.objectContaining({ starting_after: "price_s" }),
		);
	});

	it("returns an empty catalogue rather than throwing when no price is tagged", async () => {
		const stripe = stripeWith([price({ metadata: {} })]);

		await expect(listTiers(stripe)).resolves.toEqual([]);
	});
});

describe("listTiers caching", () => {
	it("reads Stripe once across repeated calls", async () => {
		const stripe = stripeWith([price()]);

		await listTiers(stripe);
		await listTiers(stripe);

		expect(stripe.list).toHaveBeenCalledTimes(1);
	});

	it("serves the same catalogue whichever organization asks, since it has none", async () => {
		const stripe = stripeWith([price()]);

		const first = await listTiers(stripe);
		const second = await listTiers(stripe);

		expect(second).toEqual(first);
	});

	it("hands out a copy, so one caller cannot corrupt another's catalogue", async () => {
		const stripe = stripeWith([price()]);

		const first = await listTiers(stripe);
		first.pop();

		await expect(listTiers(stripe)).resolves.toHaveLength(1);
	});

	it("hands out copies of the tiers themselves, not the cached ones", async () => {
		const stripe = stripeWith([price()]);

		const [tier] = await listTiers(stripe);
		if (tier) tier.amount = 1;

		await expect(listTiers(stripe)).resolves.toMatchObject([{ amount: 1900 }]);
	});

	it("reads Stripe again once the cached catalogue has aged out", async () => {
		vi.useFakeTimers();
		try {
			const stripe = stripeWith([price()]);

			await listTiers(stripe);
			vi.advanceTimersByTime(TIER_CACHE_TTL_MS + 1);
			await listTiers(stripe);

			expect(stripe.list).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
		}
	});

	it("caches nothing when the read fails, so a Stripe outage is not sticky", async () => {
		const list = vi
			.fn()
			.mockRejectedValueOnce(new Error("stripe is down"))
			.mockResolvedValueOnce({ data: [price()], has_more: false });
		const stripe = { prices: { list } } as unknown as TierPriceSource;

		await expect(listTiers(stripe)).rejects.toThrow("stripe is down");

		await expect(listTiers(stripe)).resolves.toHaveLength(1);
	});
});

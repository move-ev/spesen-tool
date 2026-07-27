import type { Prisma } from "@zemio/db";

/**
 * Fallback parsing for the deprecated `Expense.meta` Json column.
 *
 * Rows created by the pre-normalization app version during the migration
 * deploy window carry their type-specific data only in `meta` (the backfill
 * migration ran before the row existed). Until the contract migration
 * re-runs the backfill and drops the column, read and update paths fall
 * back to these parsers, which apply the same bounds and defaults as the
 * backfill in `20260727150300_add_expense_detail_tables`.
 */

export type TravelDetailValues = {
	from: string;
	to: string;
	distance: number;
};

export type FoodDetailValues = {
	days: number;
	breakfastDeduction: number;
	lunchDeduction: number;
	dinnerDeduction: number;
};

const MAX_DISTANCE = 1e6; // DECIMAL(8,2)
const MAX_DEDUCTION = 1e10; // DECIMAL(12,2)

function asRecord(meta: Prisma.JsonValue | null): Record<string, unknown> {
	return typeof meta === "object" && meta !== null && !Array.isArray(meta)
		? meta
		: {};
}

function readString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

/** Accepts JSON numbers and numeric strings (parity with the SQL backfill). */
function readBoundedAmount(value: unknown, maxAbs: number): number | null {
	const parsed =
		typeof value === "number"
			? value
			: typeof value === "string" && /^-?[0-9]+(\.[0-9]+)?$/.test(value)
				? Number(value)
				: null;
	if (parsed === null || !Number.isFinite(parsed)) {
		return null;
	}
	const rounded = Math.round(parsed * 100) / 100;
	return Math.abs(rounded) < maxAbs ? rounded : null;
}

/** Fractional or out-of-range day counts are malformed and default to 1. */
function readDays(value: unknown): number {
	const parsed =
		typeof value === "number"
			? value
			: typeof value === "string" && /^[0-9]+$/.test(value)
				? Number(value)
				: null;
	if (
		parsed === null ||
		!Number.isInteger(parsed) ||
		parsed < 1 ||
		parsed > 2147483647
	) {
		return 1;
	}
	return parsed;
}

export function travelDetailFromMeta(
	meta: Prisma.JsonValue | null,
): TravelDetailValues {
	const record = asRecord(meta);
	return {
		from: readString(record.from),
		to: readString(record.to),
		distance: readBoundedAmount(record.distance, MAX_DISTANCE) ?? 0,
	};
}

export function foodDetailFromMeta(
	meta: Prisma.JsonValue | null,
): FoodDetailValues {
	const record = asRecord(meta);
	return {
		days: readDays(record.days),
		breakfastDeduction:
			readBoundedAmount(record.breakfastDeduction, MAX_DEDUCTION) ?? 0,
		lunchDeduction: readBoundedAmount(record.lunchDeduction, MAX_DEDUCTION) ?? 0,
		dinnerDeduction:
			readBoundedAmount(record.dinnerDeduction, MAX_DEDUCTION) ?? 0,
	};
}

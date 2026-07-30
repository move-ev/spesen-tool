import { z } from "zod";
import { COST_UNIT_SORT_FIELDS, COST_UNIT_STATUSES } from "@/lib/consts";

/**
 * Server-only list input. The create/update/delete schemas deliberately stay in
 * `@/lib/validators`: the TanStack Form clients validate against the same
 * objects, and duplicating them here would let the two contracts drift.
 */

/** Bounds the filter list so a client can't hand us an unbounded rule set. */
const MAX_FILTER_RULES = 20;

const statusFilterSchema = z.object({
	field: z.literal("status"),
	op: z.enum(["in", "notIn"]),
	value: z.array(z.enum(COST_UNIT_STATUSES)).min(1),
});

/**
 * `value` carries group ids; the synthetic `NO_COST_UNIT_GROUP` id means
 * "ungrouped" and compiles to a null foreign key, mirroring how the write
 * endpoints normalize the group picker.
 */
const groupFilterSchema = z.object({
	field: z.literal("costUnitGroupId"),
	op: z.enum(["in", "notIn"]),
	value: z.array(z.string().trim().min(1)).min(1),
});

const costUnitListFilterRuleSchema = z.union([
	statusFilterSchema,
	groupFilterSchema,
]);

const costUnitListSortingSchema = z
	.array(
		z.object({
			desc: z.boolean(),
			id: z.enum(COST_UNIT_SORT_FIELDS),
		}),
	)
	.max(1)
	.optional();

export const costUnitListInputSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(200).default(20),
	search: z.string().optional(),
	filters: z
		.array(costUnitListFilterRuleSchema)
		.max(MAX_FILTER_RULES)
		.optional(),
	sorting: costUnitListSortingSchema,
});

export type CostUnitListInput = z.infer<typeof costUnitListInputSchema>;
export type CostUnitListFilterRule = z.infer<
	typeof costUnitListFilterRuleSchema
>;
export type CostUnitListSorting = z.infer<typeof costUnitListSortingSchema>;

import { z } from "zod";

/**
 * Server-only list input. The create/update/delete schemas deliberately stay in
 * `@/lib/validators`: the TanStack Form clients validate against the same
 * objects, and duplicating them here would let the two contracts drift.
 */
export const costUnitListInputSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(200).default(20),
	search: z.string().optional(),
});

export type CostUnitListInput = z.infer<typeof costUnitListInputSchema>;

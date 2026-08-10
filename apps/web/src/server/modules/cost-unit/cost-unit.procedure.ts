import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@zemio/db";
import { z } from "zod";
import { orgAdminProcedure, orgProcedure } from "@/server/api/trpc";
import {
	type CostUnitDetail,
	costUnitRepository,
} from "./cost-unit.repository";
import type { CostUnitServiceContext } from "./cost-unit.service";

/** Structural subset of the org-scoped tRPC context this module needs. */
type CostUnitRequestContext = {
	db: PrismaClient;
	organizationId: string;
	session: { user: { id: string } };
};

export function toCostUnitServiceContext(
	ctx: CostUnitRequestContext,
): CostUnitServiceContext {
	return {
		db: ctx.db,
		organizationId: ctx.organizationId,
		userId: ctx.session.user.id,
	};
}

const byIdInput = z.object({ id: z.string().min(1) });

async function loadCostUnit(
	db: PrismaClient,
	args: { id: string; organizationId: string },
): Promise<CostUnitDetail> {
	const costUnit = await costUnitRepository.findById(db, args);
	if (!costUnit) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Kostenstelle nicht gefunden.",
		});
	}
	return costUnit;
}

/**
 * Loads the cost unit scoped to the active org and attaches it to `ctx.costUnit`.
 *
 * Cost units carry no per-entity authorization — there is no owner, and access
 * is decided entirely by org role. The role gate therefore stays on the
 * procedure builder (`orgProcedure` to read, `costUnitAdminProcedure` to write)
 * and this module ships no policy module, which would only restate that.
 */
export const costUnitProcedure = orgProcedure
	.input(byIdInput)
	.use(async ({ ctx, input, next }) => {
		const costUnit = await loadCostUnit(ctx.db, {
			id: input.id,
			organizationId: ctx.organizationId,
		});
		return next({ ctx: { ...ctx, costUnit } });
	});

/** Same loader, gated to organization admins, for mutating procedures. */
export const costUnitAdminProcedure = orgAdminProcedure
	.input(byIdInput)
	.use(async ({ ctx, input, next }) => {
		const costUnit = await loadCostUnit(ctx.db, {
			id: input.id,
			organizationId: ctx.organizationId,
		});
		return next({ ctx: { ...ctx, costUnit } });
	});

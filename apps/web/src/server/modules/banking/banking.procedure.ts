import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@zemio/db";
import { z } from "zod";
import { protectedProcedure } from "@/server/api/trpc";
import { type BankingAction, bankingPolicy } from "./banking.policy";
import { bankingRepository } from "./banking.repository";
import type { BankingServiceContext } from "./banking.service";

/** Structural subset of the authenticated tRPC context this module needs. */
type BankingRequestContext = {
	db: PrismaClient;
	session: { user: { id: string } };
};

export function toBankingServiceContext(
	ctx: BankingRequestContext,
): BankingServiceContext {
	return {
		db: ctx.db,
		userId: ctx.session.user.id,
	};
}

/**
 * Resource-loader procedure factory: loads the banking details, authorizes the
 * requested action against the owner, and attaches the entity to `ctx.details`.
 *
 * This replaces the load/compare-userId/throw block that was written out once
 * per mutating endpoint.
 */
export function bankingProcedure(action: BankingAction) {
	return protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.use(async ({ ctx, input, next }) => {
			const details = await bankingRepository.findById(ctx.db, input.id);
			if (!details) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Banking details not found",
				});
			}

			bankingPolicy.authorize(
				action,
				{ userId: ctx.session.user.id },
				{ userId: details.userId },
			);

			return next({ ctx: { ...ctx, details } });
		});
}

import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@zemio/db";
import { z } from "zod";
import { orgAdminProcedure } from "@/server/api/trpc";
import {
	type MembershipRow,
	membershipRepository,
} from "./membership.repository";
import type { MembershipServiceContext } from "./membership.service";

type MembershipRequestContext = {
	db: PrismaClient;
	organizationId: string;
	headers: Headers;
};

export function toMembershipServiceContext(
	ctx: MembershipRequestContext,
): MembershipServiceContext {
	return {
		db: ctx.db,
		organizationId: ctx.organizationId,
		headers: ctx.headers,
	};
}

/**
 * Loads a membership scoped to the active org. Managing members is an admin
 * action throughout, so there is no non-admin variant of this loader.
 */
export const membershipProcedure = orgAdminProcedure
	.input(z.object({ id: z.string().min(1) }))
	.use(async ({ ctx, input, next }) => {
		const membership: MembershipRow | null = await membershipRepository.findById(
			ctx.db,
			{
				id: input.id,
				organizationId: ctx.organizationId,
			},
		);
		if (!membership) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
		}
		return next({ ctx: { ...ctx, membership } });
	});

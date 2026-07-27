import { TRPCError } from "@trpc/server";
import type { Prisma, PrismaClient } from "@zemio/db";
import { auth } from "@/server/better-auth";
import {
	offsetPageArgs,
	type PageMeta,
	toPageMeta,
} from "@/server/shared/pagination";
import {
	type MembershipRepository,
	type MembershipRow,
	membershipRepository,
} from "./membership.repository";
import type {
	MembershipListInput,
	SetMemberRoleInput,
} from "./membership.validators";

/**
 * Role assignment goes through Better Auth, which owns it, so the service needs
 * the request headers to call back into the auth API on the caller's behalf.
 */
export type MembershipServiceContext = {
	db: PrismaClient;
	organizationId: string;
	headers: Headers;
};

type PaginatedMemberships = {
	members: MembershipRow[];
	pagination: PageMeta;
};

function buildListWhere(
	organizationId: string,
	search: string | undefined,
): Prisma.MemberWhereInput {
	if (!search) {
		return { organizationId };
	}
	return {
		organizationId,
		user: { name: { contains: search, mode: "insensitive" } },
	};
}

export function createMembershipService(deps: { repo: MembershipRepository }) {
	const { repo } = deps;

	return {
		async list(
			ctx: MembershipServiceContext,
			input: MembershipListInput,
		): Promise<PaginatedMemberships> {
			const where = buildListWhere(ctx.organizationId, input.search);
			const { skip, take } = offsetPageArgs(input);

			const [members, totalCount] = await Promise.all([
				repo.listPage(ctx.db, { where, skip, take }),
				repo.count(ctx.db, where),
			]);

			return { members, pagination: toPageMeta(input, totalCount) };
		},

		async setRole(
			ctx: MembershipServiceContext,
			membership: MembershipRow,
			input: SetMemberRoleInput,
		): Promise<void> {
			if (membership.role === input.role) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Member already has this role",
				});
			}

			// Better Auth owns role assignment. Its errors are already typed API
			// errors, so they propagate untouched rather than being flattened.
			await auth.api.updateMemberRole({
				headers: ctx.headers,
				body: {
					memberId: membership.id,
					role: input.role,
					organizationId: ctx.organizationId,
				},
			});
		},
	};
}

export type MembershipService = ReturnType<typeof createMembershipService>;

export const membershipService = createMembershipService({
	repo: membershipRepository,
});

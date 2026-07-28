import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@zemio/db";
import { mapPrismaError } from "@/server/shared/errors";
import {
	type OrganizationRepository,
	type OrganizationRow,
	organizationRepository,
} from "./organization.repository";
import type { UpdateOrganizationInput } from "./organization.validators";

export type OrganizationServiceContext = {
	db: PrismaClient;
	organizationId: string;
};

export function createOrganizationService(deps: {
	repo: OrganizationRepository;
}) {
	const { repo } = deps;

	return {
		async get(ctx: OrganizationServiceContext): Promise<OrganizationRow> {
			const organization = await repo.findById(ctx.db, ctx.organizationId);
			if (!organization) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found",
				});
			}
			return organization;
		},

		async update(
			ctx: OrganizationServiceContext,
			input: UpdateOrganizationInput,
		): Promise<OrganizationRow> {
			try {
				return await repo.update(ctx.db, {
					id: ctx.organizationId,
					data: { name: input.name, logo: input.logo },
				});
			} catch (error) {
				throw mapPrismaError(error);
			}
		},
	};
}

export type OrganizationService = ReturnType<typeof createOrganizationService>;

export const organizationService = createOrganizationService({
	repo: organizationRepository,
});

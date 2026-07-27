import type { PrismaClient } from "@zemio/db";
import type { OrganizationServiceContext } from "./organization.service";

type OrganizationRequestContext = {
	db: PrismaClient;
	organizationId: string;
};

export function toOrganizationServiceContext(
	ctx: OrganizationRequestContext,
): OrganizationServiceContext {
	return { db: ctx.db, organizationId: ctx.organizationId };
}

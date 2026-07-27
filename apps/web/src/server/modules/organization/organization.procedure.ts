import type { PrismaClient } from "@zemio/db";
import type { PlatformOrganizationServiceContext } from "./organization.platform-service";
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

type PlatformRequestContext = {
	db: PrismaClient;
};

/**
 * Platform-scoped context: no organization, because these use-cases span every
 * tenant. Kept as a mapper anyway so routers never hand a raw ctx to a service.
 */
export function toPlatformOrganizationServiceContext(
	ctx: PlatformRequestContext,
): PlatformOrganizationServiceContext {
	return { db: ctx.db };
}

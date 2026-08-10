import { z } from "zod";
import { createTRPCRouter, platformAdminProcedure } from "@/server/api/trpc";
import {
	createOrganizationSchema,
	platformOrganizationService,
	toPlatformOrganizationServiceContext,
	updateOrganizationProfileSchema,
} from "@/server/modules/organization";

const organizationIdInput = z.object({ id: z.string().min(1) });

/**
 * Platform-scoped organization management, nested so the endpoint names can
 * follow the standard list/byId/create/update convention without becoming
 * ambiguous about what they operate on.
 */
const organizationsRouter = createTRPCRouter({
	list: platformAdminProcedure.query(({ ctx }) =>
		platformOrganizationService.list(toPlatformOrganizationServiceContext(ctx)),
	),

	byId: platformAdminProcedure
		.input(organizationIdInput)
		.query(({ ctx, input }) =>
			platformOrganizationService.byId(
				toPlatformOrganizationServiceContext(ctx),
				input,
			),
		),

	create: platformAdminProcedure
		.input(createOrganizationSchema)
		.mutation(({ ctx, input }) =>
			platformOrganizationService.create(
				toPlatformOrganizationServiceContext(ctx),
				input,
			),
		),

	update: platformAdminProcedure
		.input(organizationIdInput.and(updateOrganizationProfileSchema))
		.mutation(({ ctx, input }) =>
			platformOrganizationService.update(
				toPlatformOrganizationServiceContext(ctx),
				input.id,
				input,
			),
		),
});

export const platformAdminRouter = createTRPCRouter({
	organizations: organizationsRouter,
});

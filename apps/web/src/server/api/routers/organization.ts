import {
	createTRPCRouter,
	orgAdminProcedure,
	orgProcedure,
} from "@/server/api/trpc";
import {
	organizationService,
	toOrganizationServiceContext,
	updateOrganizationSchema,
} from "@/server/modules/organization";

export const organizationRouter = createTRPCRouter({
	get: orgProcedure.query(({ ctx }) =>
		organizationService.get(toOrganizationServiceContext(ctx)),
	),

	update: orgAdminProcedure
		.input(updateOrganizationSchema)
		.mutation(({ ctx, input }) =>
			organizationService.update(toOrganizationServiceContext(ctx), input),
		),
});

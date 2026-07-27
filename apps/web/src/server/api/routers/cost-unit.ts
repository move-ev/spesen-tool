import {
	createCostUnitGroupSchema,
	createCostUnitSchema,
	deleteCostUnitGroupSchema,
	updateCostUnitGroupSchema,
	updateCostUnitSchema,
} from "@/lib/validators";
import {
	createTRPCRouter,
	orgAdminProcedure,
	orgProcedure,
} from "@/server/api/trpc";
import {
	costUnitAdminProcedure,
	costUnitListInputSchema,
	costUnitProcedure,
	costUnitService,
	toCostUnitServiceContext,
} from "@/server/modules/cost-unit";

export const costUnitRouter = createTRPCRouter({
	byId: costUnitProcedure.query(({ ctx }) => ctx.costUnit),

	list: orgProcedure
		.input(costUnitListInputSchema)
		.query(({ ctx, input }) =>
			costUnitService.list(toCostUnitServiceContext(ctx), input),
		),

	listForSelection: orgProcedure.query(({ ctx }) =>
		costUnitService.listForSelection(toCostUnitServiceContext(ctx)),
	),

	listGroups: orgProcedure.query(({ ctx }) =>
		costUnitService.listGroups(toCostUnitServiceContext(ctx)),
	),

	create: orgAdminProcedure
		.input(createCostUnitSchema)
		.mutation(({ ctx, input }) =>
			costUnitService.create(toCostUnitServiceContext(ctx), input),
		),

	update: costUnitAdminProcedure
		.input(updateCostUnitSchema)
		.mutation(({ ctx, input }) =>
			costUnitService.update(toCostUnitServiceContext(ctx), ctx.costUnit, input),
		),

	delete: costUnitAdminProcedure.mutation(({ ctx }) =>
		costUnitService.remove(toCostUnitServiceContext(ctx), ctx.costUnit),
	),

	createGroup: orgAdminProcedure
		.input(createCostUnitGroupSchema)
		.mutation(({ ctx, input }) =>
			costUnitService.createGroup(toCostUnitServiceContext(ctx), input),
		),

	updateGroup: orgAdminProcedure
		.input(updateCostUnitGroupSchema)
		.mutation(({ ctx, input }) =>
			costUnitService.updateGroup(toCostUnitServiceContext(ctx), input),
		),

	deleteGroup: orgAdminProcedure
		.input(deleteCostUnitGroupSchema)
		.mutation(({ ctx, input }) =>
			costUnitService.removeGroup(toCostUnitServiceContext(ctx), input),
		),
});

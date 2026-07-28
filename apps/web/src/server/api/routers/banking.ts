import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	bankingDetailsInputSchema,
	bankingProcedure,
	bankingService,
	toBankingServiceContext,
	validateIbanSchema,
} from "@/server/modules/banking";

export const bankingDetailsRouter = createTRPCRouter({
	validateIban: protectedProcedure
		.input(validateIbanSchema)
		.query(({ input }) => bankingService.validateIban(input)),

	list: protectedProcedure.query(({ ctx }) =>
		bankingService.list(toBankingServiceContext(ctx)),
	),

	byId: bankingProcedure("read").query(({ ctx }) =>
		bankingService.byId(ctx.details),
	),

	create: protectedProcedure
		.input(bankingDetailsInputSchema)
		.mutation(({ ctx, input }) =>
			bankingService.create(toBankingServiceContext(ctx), input),
		),

	update: bankingProcedure("update")
		.input(bankingDetailsInputSchema)
		.mutation(({ ctx, input }) =>
			bankingService.update(toBankingServiceContext(ctx), ctx.details, input),
		),

	delete: bankingProcedure("delete").mutation(({ ctx }) =>
		bankingService.remove(toBankingServiceContext(ctx), ctx.details),
	),
});

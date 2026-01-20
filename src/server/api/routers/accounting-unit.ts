import z from "zod";
import { createAccountingUnitSchema } from "@/lib/validators";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const accountingUnitRouter = createTRPCRouter({
	listAll: adminProcedure.query(async ({ ctx }) => {
		return await ctx.db.accountingUnit.findMany();
	}),
	create: adminProcedure
		.input(createAccountingUnitSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.accountingUnit.create({
				data: {
					name: input.name,
				},
			});
		}),

	delete: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.accountingUnit.delete({
				where: { id: input.id },
			});
		}),
});

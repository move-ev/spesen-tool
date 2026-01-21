import z from "zod";
import { createBusinessUnitSchema } from "@/lib/validators";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

export const businessUnitRouter = createTRPCRouter({
	listAll: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.businessUnit.findMany();
	}),
	create: adminProcedure
		.input(createBusinessUnitSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.businessUnit.create({
				data: {
					name: input.name,
				},
			});
		}),

	delete: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.businessUnit.delete({
				where: { id: input.id },
			});
		}),
});

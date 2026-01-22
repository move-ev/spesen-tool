import {
	createCostUnitGroupSchema,
	createCostUnitSchema,
} from "@/lib/validators";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

export const costUnitRouter = createTRPCRouter({
	listGrouped: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.costUnit.findMany({});
	}),

	listGroups: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.costUnitGroup.findMany();
	}),

	create: adminProcedure
		.input(createCostUnitSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.costUnit.create({
				data: {
					tag: input.tag,
					title: input.title,
					examples: input.examples,
					...(input.costUnitGroupId.length > 0 &&
						input.costUnitGroupId !== "NONE" && {
							costUnitGroup: {
								connect: {
									id: input.costUnitGroupId,
								},
							},
						}),
				},
			});
		}),

	createGroup: adminProcedure
		.input(createCostUnitGroupSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.costUnitGroup.create({
				data: {
					title: input.title,
				},
			});
		}),
});

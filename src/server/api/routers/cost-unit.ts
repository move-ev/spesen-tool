import { createTRPCRouter, protectedProcedure } from "../trpc";

export const costUnitRouter = createTRPCRouter({
	listGrouped: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.costUnitGroup.findMany({
			include: {
				costUnits: true,
			},
		});
	}),
});

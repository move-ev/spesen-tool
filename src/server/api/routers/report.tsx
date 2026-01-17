import { z } from "zod";
import { createReportSchema } from "@/lib/validators";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const reportRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createReportSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.report.create({
				data: {
					...input,
					owner: { connect: { id: ctx.session.user.id } },
				},
			});
		}),
});

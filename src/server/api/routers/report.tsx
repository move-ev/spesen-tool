import { TRPCError } from "@trpc/server";
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
	listOwn: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.report.findMany({
			where: {
				ownerId: ctx.session.user.id,
			},
		});
	}),
	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const report = await ctx.db.report.findUnique({
				where: {
					id: input.id,
				},
			});

			if (!report) {
				return null;
			}

			if (
				report.ownerId !== ctx.session.user.id &&
				ctx.session.user.role !== "admin"
			) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			return report;
		}),
});

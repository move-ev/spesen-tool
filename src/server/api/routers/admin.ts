import { ReportStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const adminRouter = createTRPCRouter({
	// Get all reports (admin only)
	getAllReports: protectedProcedure.query(async ({ ctx }) => {
		// Check if user is admin
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: { admin: true },
		});

		if (user?.admin !== true) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Only admins can access all reports",
			});
		}

		return ctx.db.report.findMany({
			include: {
				expenses: true,
				owner: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	}),

	// Get a single report by ID (admin can access any report)
	getReportById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			// Check if user is admin
			const user = await ctx.db.user.findUnique({
				where: { id: ctx.session.user.id },
				select: { admin: true },
			});

			if (user?.admin !== true) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only admins can access this endpoint",
				});
			}

			const report = await ctx.db.report.findUnique({
				where: {
					id: input.id,
				},
				include: {
					expenses: true,
					owner: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			return report;
		}),

	// Update report status (admin only)
	updateReportStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.nativeEnum(ReportStatus),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user is admin
			const user = await ctx.db.user.findUnique({
				where: { id: ctx.session.user.id },
				select: { admin: true },
			});

			if (user?.admin !== true) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only admins can update report status",
				});
			}

			const report = await ctx.db.report.findUnique({
				where: { id: input.id },
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			return ctx.db.report.update({
				where: { id: input.id },
				data: { status: input.status },
				include: {
					expenses: true,
					owner: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});
		}),
});

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ReportStatus } from "@/generated/prisma/enums";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";

export const adminRouter = createTRPCRouter({
	stats: adminProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		const [totalReports, openReports, totalAmount] = await db.$transaction([
			db.report.count(),
			db.report.count({
				where: {
					status: {
						in: [ReportStatus.PENDING_APPROVAL],
					},
				},
			}),
			db.expense.aggregate({
				_sum: {
					amount: true,
				},
			}),
		]);

		return {
			totalCount: totalReports,
			openCount: openReports,
			totalAmount: totalAmount._sum.amount ? Number(totalAmount._sum.amount) : 0,
		};
	}),
	listOpen: adminProcedure.query(async ({ ctx }) => {
		const reports = await ctx.db.report.findMany({
			where: {
				status: {
					in: [ReportStatus.PENDING_APPROVAL],
				},
			},
			include: {
				owner: {
					select: {
						name: true,
					},
				},
				expenses: {
					select: {
						amount: true,
					},
				},
			},
			orderBy: {
				lastUpdatedAt: "desc",
			},
		});

		return reports.map((report) => ({
			...report,
			expenses: report.expenses.map((expense) => ({
				...expense,
				amount: Number(expense.amount),
			})),
		}));
	}),
	/**
	 * Lists all reports, which are NOT open and not a draft which have been updated in the last 30 days.
	 * Optional filters allow narrowing by status and date range.
	 */
	listRelevant: adminProcedure
		.input(
			z
				.object({
					dateFrom: z.date().optional(),
					dateTo: z.date().optional(),
					status: z.nativeEnum(ReportStatus).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
			const hasCustomRange = !!(input?.dateFrom || input?.dateTo);
			const dateFrom = hasCustomRange ? input?.dateFrom : pastDate;
			const dateTo = input?.dateTo;

			const lastUpdatedAt: { gte?: Date; lte?: Date } = {};
			if (dateFrom) {
				lastUpdatedAt.gte = dateFrom;
			}
			if (dateTo) {
				const endOfDay = new Date(dateTo);
				endOfDay.setHours(23, 59, 59, 999);
				lastUpdatedAt.lte = endOfDay;
			}

			const reports = await ctx.db.report.findMany({
				where: {
					status: input?.status
						? {
								in: [input.status],
								notIn: [ReportStatus.PENDING_APPROVAL, ReportStatus.DRAFT],
							}
						: {
								notIn: [ReportStatus.PENDING_APPROVAL, ReportStatus.DRAFT],
							},
					lastUpdatedAt,
				},
				include: {
					expenses: {
						select: {
							amount: true,
						},
					},
					owner: {
						select: {
							name: true,
						},
					},
				},
				orderBy: {
					lastUpdatedAt: "desc",
				},
			});

			return reports.map((report) => ({
				...report,
				expenses: report.expenses.map((expense) => ({
					...expense,
					amount: Number(expense.amount),
				})),
			}));
		}),
	getAllReports: adminProcedure.query(async ({ ctx }) => {
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

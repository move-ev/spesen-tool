import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ReportStatus } from "@/generated/prisma/enums";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 50;

const paginationInput = z.object({
	limit: z.number().min(1).max(100).default(DEFAULT_PAGE_SIZE),
	cursor: z.string().nullish(),
});

export const adminRouter = createTRPCRouter({
	/**
	 * Returns filter options for the admin reports list.
	 * Fetches cost units and owners directly from their respective tables.
	 */
	getFilterOptions: adminProcedure.query(async ({ ctx }) => {
		const [costUnits, owners] = await ctx.db.$transaction([
			ctx.db.costUnit.findMany({
				select: { tag: true },
				orderBy: { tag: "asc" },
			}),
			ctx.db.user.findMany({
				where: { ownReports: { some: {} } },
				select: { email: true, name: true, image: true },
				orderBy: { name: "asc" },
			}),
		]);

		return {
			costUnits: costUnits.map((cu) => ({
				label: cu.tag,
				value: cu.tag,
			})),
			owners: owners.map((owner) => ({
				label: owner.name,
				value: owner.email,
				image: owner.image,
			})),
		};
	}),

	/**
	 * Paginated list of all reports with cursor-based pagination.
	 * Returns items, nextCursor, and totalCount for infinite scroll.
	 */
	listAllPaginated: adminProcedure
		.input(paginationInput)
		.query(async ({ ctx, input }) => {
			const { limit, cursor } = input;

			const [items, totalCount] = await ctx.db.$transaction([
				ctx.db.report.findMany({
					take: limit + 1, // Fetch one extra to determine if there's a next page
					cursor: cursor ? { id: cursor } : undefined,
					include: {
						owner: {
							select: {
								name: true,
								image: true,
								email: true,
							},
						},
						costUnit: {
							select: {
								tag: true,
							},
						},
					},
					orderBy: {
						lastUpdatedAt: "desc",
					},
				}),
				ctx.db.report.count(),
			]);

			let nextCursor: string | undefined;
			if (items.length > limit) {
				const nextItem = items.pop();
				nextCursor = nextItem?.id;
			}

			return {
				items,
				nextCursor,
				totalCount,
			};
		}),

	/**
	 * @deprecated Use listAllPaginated instead for better performance
	 */
	listAll: adminProcedure.query(async ({ ctx }) => {
		return ctx.db.report.findMany({
			include: {
				owner: {
					select: {
						name: true,
						image: true,
						email: true,
					},
				},
				costUnit: {
					select: {
						tag: true,
					},
				},
			},
			orderBy: {
				lastUpdatedAt: "desc",
			},
		});
	}),

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
	 * Lists all reports, which are NOT open and not a draft which have been updated in the last 30 days
	 */
	listRelevant: adminProcedure.query(async ({ ctx }) => {
		const pastDate = new Date(Date.now() - THIRTY_DAYS_IN_MS);

		const reports = await ctx.db.report.findMany({
			where: {
				status: {
					notIn: [ReportStatus.PENDING_APPROVAL, ReportStatus.DRAFT],
				},
				lastUpdatedAt: {
					gte: pastDate,
				},
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
	getReportById: adminProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
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
	updateReportStatus: adminProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.nativeEnum(ReportStatus),
			}),
		)
		.mutation(async ({ ctx, input }) => {
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

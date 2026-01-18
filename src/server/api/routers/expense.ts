import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ExpenseType } from "@/generated/prisma/enums";
import {
	createFoodExpenseSchema,
	createReceiptExpenseSchema,
	createTravelExpenseSchema,
	foodExpenseMetaSchema,
	receiptExpenseMetaSchema,
	travelExpenseMetaSchema,
} from "@/lib/validators";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const expenseRouter = createTRPCRouter({
	listForReport: protectedProcedure
		.input(z.object({ reportId: z.string() }))
		.query(async ({ ctx, input }) => {
			const expenses = await ctx.db.expense.findMany({
				where: { reportId: input.reportId },
				include: {
					attachments: true,
				},
			});

			return expenses.map((expense) => ({
				...expense,
				amount: Number(expense.amount),
			}));
		}),
	// Get all expenses for a report
	getByReportId: protectedProcedure
		.input(z.object({ reportId: z.string() }))
		.query(async ({ ctx, input }) => {
			// First check if user owns the report
			const report = await ctx.db.report.findUnique({
				where: { id: input.reportId },
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			if (report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this report",
				});
			}

			return ctx.db.expense.findMany({
				where: {
					reportId: input.reportId,
				},
				orderBy: {
					startDate: "desc",
				},
			});
		}),

	createReceipt: protectedProcedure
		.input(createReceiptExpenseSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user owns the report
			const report = await ctx.db.report.findUnique({
				where: { id: input.reportId },
				select: {
					ownerId: true,
				},
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			if (report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to add expenses to this report",
				});
			}

			// Create the meta data
			const meta = JSON.stringify({});

			const expense = await ctx.db.expense.create({
				data: {
					report: { connect: { id: input.reportId } },
					type: ExpenseType.RECEIPT,
					amount: input.amount,
					startDate: input.startDate,
					endDate: input.endDate,
					description: input.description,
					meta: meta,
					attachments: {
						createMany: { data: input.objectKeys.map((key) => ({ key })) },
					},
				},
			});

			if (!expense) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create expense",
				});
			}

			return expense;
		}),

	createTravel: protectedProcedure
		.input(createTravelExpenseSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user owns the report
			const report = await ctx.db.report.findUnique({
				where: { id: input.reportId },
				select: {
					ownerId: true,
				},
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			if (report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to add expenses to this report",
				});
			}

			const settings = await ctx.db.settings.findUnique({
				where: { id: "singleton" },
				select: {
					kilometerRate: true,
				},
			});

			if (!settings) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "App settings have not been set up correctly",
				});
			}

			// Create the meta data
			const meta = JSON.stringify({
				from: input.from,
				to: input.to,
				distance: input.distance,
			});

			return await ctx.db.expense.create({
				data: {
					report: { connect: { id: input.reportId } },
					type: ExpenseType.TRAVEL,
					amount: Number(input.distance) * Number(settings.kilometerRate),
					startDate: input.startDate,
					endDate: input.endDate,
					description: input.description,
					meta: meta,
				},
			});
		}),

	createFood: protectedProcedure
		.input(createFoodExpenseSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user owns the report
			const report = await ctx.db.report.findUnique({
				where: { id: input.reportId },
				select: {
					ownerId: true,
				},
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			if (report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to add expenses to this report",
				});
			}

			// Create the meta data
			const meta = JSON.stringify({
				days: input.days,
				breakfastDeduction: input.breakfastDeduction,
				lunchDeduction: input.lunchDeduction,
				dinnerDeduction: input.dinnerDeduction,
			});

			return await ctx.db.expense.create({
				data: {
					report: { connect: { id: input.reportId } },
					type: ExpenseType.FOOD,
					amount: input.amount,
					startDate: input.startDate,
					endDate: input.endDate,
					description: input.description,
					meta: meta,
				},
			});
		}),

	// Update an expense
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				description: z.string().optional(),
				amount: z.number().positive().optional(),
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				receiptFileUrl: z
					.string()
					.refine(
						(val) => {
							if (!val) return true; // optional
							// Akzeptiere vollständige URLs oder relative Pfade die mit / beginnen
							return (
								val.startsWith("http://") ||
								val.startsWith("https://") ||
								val.startsWith("/")
							);
						},
						{
							message: "Must be a valid URL or relative path starting with /",
						},
					)
					.optional(),
				reason: z.string().optional(),
				kilometers: z.number().positive().optional(),
				departure: z.string().optional(),
				destination: z.string().optional(),
				travelReason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const expense = await ctx.db.expense.findUnique({
				where: { id },
				include: { report: true },
			});

			if (!expense) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			if (expense.report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to update this expense",
				});
			}

			// If kilometers changed for travel expense, recalculate amount
			if (data.kilometers && expense.type === ExpenseType.TRAVEL) {
				const settings = await ctx.db.settings.findUnique({
					where: { id: "singleton" },
				});
				const kilometerRate = settings?.kilometerRate ?? 0.3;
				data.amount = Number(data.kilometers) * Number(kilometerRate);
			}

			return ctx.db.expense.update({
				where: { id },
				data,
			});
		}),

	// Delete an expense
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const expense = await ctx.db.expense.findUnique({
				where: { id: input.id },
				include: { report: true },
			});

			if (!expense) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			if (expense.report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to delete this expense",
				});
			}

			return ctx.db.expense.delete({
				where: { id: input.id },
			});
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const expense = await ctx.db.expense.findUnique({
				where: { id: input.id },
				include: {
					report: {
						select: {
							ownerId: true,
						},
					},
				},
			});

			if (!expense) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			// Only allow admins and owners to access the expense
			const isAdmin = ctx.session.user.role === "admin";
			if (!isAdmin && expense.report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to access this expense",
				});
			}

			// Check if the meta data is valid for the expense type
			const type = expense.type;

			if (type === "RECEIPT") {
				const result = await receiptExpenseMetaSchema.safeParse(expense.meta);

				if (!result.success) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid Receipt meta data",
					});
				}

				return {
					...expense,
					type: "RECEIPT",
					...result.data,
				};
			}
			if (type === "TRAVEL") {
				const result = await travelExpenseMetaSchema.safeParse(expense.meta);

				if (!result.success) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid Travel meta data",
					});
				}

				return {
					...expense,
					type: "TRAVEL",
					...result.data,
				};
			}

			if (type === "FOOD") {
				const result = await foodExpenseMetaSchema.safeParse(expense.meta);

				if (!result.success) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid Food meta data",
					});
				}

				return {
					...expense,
					type: "FOOD",
					...result.data,
				};
			}

			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid expense type",
			});
		}),
});

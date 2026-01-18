import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";
import { ExpenseType } from "@prisma/client";

export const expenseRouter = createTRPCRouter({
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

	// Create a receipt expense
	createReceipt: protectedProcedure
		.input(
			z.object({
				reportId: z.string(),
				description: z.string().optional(),
				amount: z.number().positive(),
				startDate: z.date(),
				endDate: z.date(),
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
							message:
								"Must be a valid URL or relative path starting with /",
						},
					)
					.optional(),
				reason: z.string().min(1, "Reason is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user owns the report
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
					message: "You don't have permission to add expenses to this report",
				});
			}

			return ctx.db.expense.create({
				data: {
					reportId: input.reportId,
					type: ExpenseType.RECEIPT,
					amount: input.amount,
					startDate: input.startDate,
					endDate: input.endDate,
					description: input.description,
					receiptFileUrl: input.receiptFileUrl,
					reason: input.reason,
					meta: {},
				},
			});
		}),

	// Create a travel expense
	createTravel: protectedProcedure
		.input(
			z.object({
				reportId: z.string(),
				description: z.string().optional(),
				kilometers: z.number().positive(),
				departure: z.string().min(1, "Departure location is required"),
				destination: z.string().min(1, "Destination is required"),
				travelReason: z.string().min(1, "Travel reason is required"),
				startDate: z.date(),
				endDate: z.date(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user owns the report
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
					message: "You don't have permission to add expenses to this report",
				});
			}

			// Get kilometer rate from settings
			const settings = await ctx.db.settings.findUnique({
				where: { id: "singleton" },
			});

			const kilometerRate = settings?.kilometerRate ?? 0.3;
			const amount = Number(input.kilometers) * Number(kilometerRate);

			return ctx.db.expense.create({
				data: {
					reportId: input.reportId,
					type: ExpenseType.TRAVEL,
					amount,
					startDate: input.startDate,
					endDate: input.endDate,
					description: input.description,
					kilometers: input.kilometers,
					departure: input.departure,
					destination: input.destination,
					travelReason: input.travelReason,
					meta: {},
				},
			});
		}),

	// Create a food expense
	createFood: protectedProcedure
		.input(
			z.object({
				reportId: z.string(),
				description: z.string().optional(),
				amount: z.number().positive(),
				startDate: z.date(),
				endDate: z.date(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user owns the report
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
					message: "You don't have permission to add expenses to this report",
				});
			}

			return ctx.db.expense.create({
				data: {
					reportId: input.reportId,
					type: ExpenseType.FOOD,
					amount: input.amount,
					startDate: input.startDate,
					endDate: input.endDate,
					description: input.description,
					meta: {},
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
							message:
								"Must be a valid URL or relative path starting with /",
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
});

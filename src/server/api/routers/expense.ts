import { TRPCError } from "@trpc/server";
import { isValid, toDate } from "date-fns";
import { ExpenseType } from "generated/prisma/enums";
import z from "zod";
import { createTravelExpenseSchema } from "@/lib/validators";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const expenseRouter = createTRPCRouter({
	list: protectedProcedure
		.input(z.object({ reportId: z.string() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db.expense.findMany({
				where: { reportId: input.reportId },
			});
		}),
	createTravel: protectedProcedure
		.input(createTravelExpenseSchema)
		.mutation(async ({ ctx, input }) => {
			if (!isValid(input.startDate) || !isValid(input.endDate)) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Ungültige Daten" });
			}

			const meta = {
				from: input.from,
				to: input.to,
				distance: input.distance,
			};

			return await ctx.db.expense.create({
				data: {
					amount: input.amount,
					endDate: toDate(input.endDate),
					startDate: toDate(input.startDate),
					type: ExpenseType.TRAVEL,
					description: input.description,
					meta,
					report: { connect: { id: input.reportId } },
				},
			});
		}),
});

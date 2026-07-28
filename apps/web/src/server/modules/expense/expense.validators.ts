import { ExpenseType } from "@zemio/db/enums";
import { isValid, parse } from "date-fns";
import z from "zod";
import {
	attachmentInputSchema,
	MAX_ATTACHMENTS_PER_EXPENSE,
} from "@/server/modules/attachment";

export const baseCreateExpenseSchema = z.object({
	description: z.string(),
	amount: z.number().min(0).multipleOf(0.01),
	startDate: z
		.string()
		.min(1, "expense.startDateRequired")
		.refine(
			(val) => {
				const date = parse(val, "dd.MM.yyyy", new Date());
				return isValid(date);
			},
			{ message: "expense.invalidStartDate" },
		)
		.transform((val) => parse(val, "dd.MM.yyyy", new Date())),
	endDate: z
		.string()
		.min(1, "expense.endDateRequired")
		.refine(
			(val) => {
				const date = parse(val, "dd.MM.yyyy", new Date());
				return isValid(date);
			},
			{ message: "expense.invalidEndDate" },
		)
		.transform((val) => parse(val, "dd.MM.yyyy", new Date())),
	type: z.enum(ExpenseType),
	reportId: z.string().min(1),
});

export const createReceiptExpenseSchema = baseCreateExpenseSchema.and(
	z.object({
		// Creating a receipt sets the expense's entire attachment set, so the
		// per-expense total is the binding limit here, not the per-upload batch.
		attachments: attachmentInputSchema.array().max(MAX_ATTACHMENTS_PER_EXPENSE),
	}),
);

export const createTravelExpenseSchema = baseCreateExpenseSchema.and(
	z.object({
		from: z.string().min(1),
		to: z.string().min(1),
		distance: z.number().min(0),
	}),
);

export const createFoodExpenseSchema = baseCreateExpenseSchema.and(
	z.object({
		days: z.number().int().min(1),
		breakfastDeduction: z.number().min(0).multipleOf(0.01),
		lunchDeduction: z.number().min(0).multipleOf(0.01),
		dinnerDeduction: z.number().min(0).multipleOf(0.01),
	}),
);

export const updateExpenseSchema = z.object({
	description: z.string().optional(),
	amount: z.number().min(0).multipleOf(0.01).optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	from: z.string().min(1).optional(),
	to: z.string().min(1).optional(),
	distance: z.number().min(1).optional(),
	days: z.number().int().min(1).optional(),
	breakfastDeduction: z.number().min(0).multipleOf(0.01).optional(),
	lunchDeduction: z.number().min(0).multipleOf(0.01).optional(),
	dinnerDeduction: z.number().min(0).multipleOf(0.01).optional(),
});

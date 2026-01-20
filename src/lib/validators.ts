import { isValid, parse } from "date-fns";
import z from "zod";
import { ExpenseType } from "@/generated/prisma/enums";

export const createReportSchema = z.object({
	title: z.string().min(1),
	description: z.string(),
	businessUnit: z.string().min(1),
	accountingUnit: z.string().min(1),
});

export const baseCreateExpenseSchema = z.object({
	description: z.string(),
	amount: z.number().min(0),
	startDate: z
		.string()
		.min(1, "Startdatum ist erforderlich")
		.refine(
			(val) => {
				const date = parse(val, "dd.MM.yyyy", new Date());
				return isValid(date);
			},
			{ message: "Ungültiges Startdatum" },
		)
		.transform((val) => parse(val, "dd.MM.yyyy", new Date())),
	endDate: z
		.string()
		.min(1, "Enddatum ist erforderlich")
		.refine(
			(val) => {
				const date = parse(val, "dd.MM.yyyy", new Date());
				return isValid(date);
			},
			{ message: "Ungültiges Enddatum" },
		)
		.transform((val) => parse(val, "dd.MM.yyyy", new Date())),
	type: z.nativeEnum(ExpenseType),
	reportId: z.string().min(1),
});

export const createReceiptExpenseSchema = baseCreateExpenseSchema.and(
	z.object({
		objectKeys: z.string().array(),
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
		days: z.number().min(1),
		breakfastDeduction: z.number().min(0),
		lunchDeduction: z.number().min(0),
		dinnerDeduction: z.number().min(0),
	}),
);

// ================================ META FIELDS ================================

export const receiptExpenseMetaSchema = z.object({});

export const travelExpenseMetaSchema = z.object({
	from: z.string().min(1),
	to: z.string().min(1),
	distance: z.number().min(1),
});

export const foodExpenseMetaSchema = z.object({
	days: z.number().min(1),
	breakfastDeduction: z.number().min(0),
	lunchDeduction: z.number().min(0),
	dinnerDeduction: z.number().min(0),
});

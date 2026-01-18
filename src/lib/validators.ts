import { isValid, parse } from "date-fns";
import z from "zod";
import { ExpenseType } from "./enums";

export const createReportSchema = z.object({
	title: z.string().min(1),
	description: z.string(),
	businessUnit: z.string().min(1),
	accountingUnit: z.string().min(1),
});

const baseDateSchema = z.string().min(1);

const amountSchema = z
	.string()
	.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
		message: "Betrag muss eine positive Zahl sein",
	});

const kilometerSchema = z
	.string()
	.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
		message: "Kilometeranzahl muss eine positive Zahl sein",
	});

const baseExpenseSchema = z.object({
	type: z.nativeEnum(ExpenseType),
	description: z.string(),
	amount: z.string(),
	reason: z.string(),
	receiptFile: z.union([z.instanceof(File), z.null()]),
	kilometers: z.string(),
	departure: z.string(),
	destination: z.string(),
	travelReason: z.string(),
	startDate: baseDateSchema,
	endDate: baseDateSchema,
});

/**
 * @deprecated Use the baseCreateExpenseSchema instead
 */
export const createExpenseSchema = baseExpenseSchema.superRefine(
	(values, ctx) => {
		if (values.type === ExpenseType.RECEIPT) {
			const amountResult = amountSchema.safeParse(values.amount);
			if (!amountResult.success) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						amountResult.error.issues[0]?.message ??
						"Betrag muss eine positive Zahl sein",
					path: ["amount"],
				});
			}

			if (!values.reason || values.reason.length < 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Grund ist erforderlich",
					path: ["reason"],
				});
			}
		}

		if (values.type === ExpenseType.TRAVEL) {
			const kilometerResult = kilometerSchema.safeParse(values.kilometers);
			if (!kilometerResult.success) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						kilometerResult.error.issues[0]?.message ??
						"Kilometeranzahl muss eine positive Zahl sein",
					path: ["kilometers"],
				});
			}

			if (!values.departure || values.departure.length < 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Abfahrtsort ist erforderlich",
					path: ["departure"],
				});
			}

			if (!values.destination || values.destination.length < 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Zielort ist erforderlich",
					path: ["destination"],
				});
			}

			if (!values.travelReason || values.travelReason.length < 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Grund ist erforderlich",
					path: ["travelReason"],
				});
			}
		}

		if (values.type === ExpenseType.FOOD) {
			const amountResult = amountSchema.safeParse(values.amount);
			if (!amountResult.success) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						amountResult.error.issues[0]?.message ??
						"Betrag muss eine positive Zahl sein",
					path: ["amount"],
				});
			}
		}
	},
);

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
	type: z.enum(ExpenseType),
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
	calculatedAmount: z.number().min(0),
});

export const foodExpenseMetaSchema = z.object({
	days: z.number().min(1),
	breakfastDeduction: z.number().min(0),
	lunchDeduction: z.number().min(0),
	dinnerDeduction: z.number().min(0),
	calculatedAmount: z.number().min(0),
});

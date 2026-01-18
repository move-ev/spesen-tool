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

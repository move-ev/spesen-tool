import z from "zod";

export const createReportSchema = z.object({
	title: z.string().min(1),
	description: z.string(),
	businessUnit: z.string().min(1),
	accountingUnit: z.string().min(1),
});

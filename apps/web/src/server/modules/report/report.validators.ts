import { ReportStatus } from "@zemio/db";
import { z } from "zod";

/**
 * Identifies a report for the endpoints that load their own projection rather
 * than going through reportProcedure (review, financialSummary).
 */
export const reportIdInputSchema = z.object({ id: z.string().min(1) });

export const updateReportSchema = z.object({
	title: z.string().min(1).optional(),
	description: z.string().optional(),
});

/**
 * `notify` controls whether the owner is emailed about the transition; the
 * legality of the transition itself is decided by report.state, not here.
 */
export const transitionReportSchema = z.object({
	status: z.nativeEnum(ReportStatus),
	notify: z.boolean().optional(),
});

export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type TransitionReportInput = z.infer<typeof transitionReportSchema>;

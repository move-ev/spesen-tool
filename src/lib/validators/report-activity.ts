import z from "zod";
import { ReportStatus } from "@/generated/prisma/enums";

export const reportStatusChangeMetaSchema = z.object({
	from: z.enum(ReportStatus),
	to: z.enum(ReportStatus),
});

export const reportCommentMetaSchema = z.object({
	message: z.string(),
});

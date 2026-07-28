import { createTRPCRouter } from "@/server/api/trpc";
import {
	addAuditCommentSchema,
	auditListInputSchema,
	auditService,
	toAuditServiceContext,
} from "@/server/modules/audit";
import { reportProcedure } from "@/server/modules/report";

export const auditRouter = createTRPCRouter({
	list: reportProcedure("read")
		.input(auditListInputSchema)
		.query(({ ctx, input }) =>
			auditService.list(toAuditServiceContext(ctx), ctx.report.id, input),
		),

	history: reportProcedure("read")
		.input(auditListInputSchema)
		.query(({ ctx, input }) =>
			auditService.history(toAuditServiceContext(ctx), ctx.report.id, input),
		),

	addComment: reportProcedure("comment")
		.input(addAuditCommentSchema)
		.mutation(({ ctx, input }) =>
			auditService.addComment(
				toAuditServiceContext(ctx),
				ctx.report.id,
				input.text,
			),
		),
});

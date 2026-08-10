import {
	createTRPCRouter,
	orgAdminProcedure,
	orgProcedure,
} from "@/server/api/trpc";
import {
	addAttachmentsToExpenseSchema,
	attachmentProcedure,
	attachmentService,
	deletePendingUploadsSchema,
	getBatchDownloadUrlsSchema,
	getUploadUrlsSchema,
	toAttachmentServiceContext,
} from "@/server/modules/attachment/";
import { expenseProcedure } from "@/server/modules/expense";
import { reportProcedure } from "@/server/modules/report";

export const attachmentRouter = createTRPCRouter({
	list: expenseProcedure("read").query(({ ctx }) =>
		attachmentService.list(toAttachmentServiceContext(ctx), ctx.expense),
	),

	listForReport: reportProcedure("read").query(({ ctx }) =>
		attachmentService.listForReport(
			toAttachmentServiceContext(ctx),
			ctx.report.id,
		),
	),

	getDownloadUrl: attachmentProcedure("read").mutation(({ ctx }) =>
		attachmentService.getDownloadUrl(ctx.attachment),
	),

	getBatchDownloadUrls: orgAdminProcedure
		.input(getBatchDownloadUrlsSchema)
		.mutation(({ ctx, input }) =>
			attachmentService.getBatchDownloadUrls(
				toAttachmentServiceContext(ctx),
				input,
			),
		),

	getUploadUrls: orgProcedure
		.input(getUploadUrlsSchema)
		.mutation(({ ctx, input }) =>
			attachmentService.getUploadUrls(toAttachmentServiceContext(ctx), input),
		),

	addToExpense: expenseProcedure("addAttachment")
		.input(addAttachmentsToExpenseSchema)
		.mutation(({ ctx, input }) =>
			attachmentService.addToExpense(
				toAttachmentServiceContext(ctx),
				ctx.expense,
				input,
			),
		),

	delete: attachmentProcedure("delete").mutation(({ ctx }) =>
		attachmentService.delete(toAttachmentServiceContext(ctx), ctx.attachment),
	),

	deletePendingUploads: orgProcedure
		.input(deletePendingUploadsSchema)
		.mutation(({ ctx, input }) =>
			attachmentService.deletePendingUploads(
				toAttachmentServiceContext(ctx),
				input,
			),
		),
});

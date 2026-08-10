import { createReportSchema } from "@/lib/validators";
import {
	createTRPCRouter,
	orgAdminProcedure,
	orgProcedure,
} from "@/server/api/trpc";
import {
	registerReportEmailSubscribers,
	reportIdInputSchema,
	reportListInputSchema,
	reportProcedure,
	reportService,
	toReportDetailDTO,
	toReportServiceContext,
	transitionReportSchema,
	updateReportSchema,
} from "@/server/modules/report";

// Wire the email side-effects to the report event bus when the router loads.
registerReportEmailSubscribers();

export const reportRouter = createTRPCRouter({
	list: orgProcedure
		.input(reportListInputSchema)
		.query(({ ctx, input }) =>
			reportService.list(toReportServiceContext(ctx), input),
		),

	review: orgAdminProcedure
		.input(reportIdInputSchema)
		.query(({ ctx, input }) =>
			reportService.review(toReportServiceContext(ctx), input),
		),

	byId: reportProcedure("read").query(({ ctx }) =>
		toReportDetailDTO(ctx.report),
	),

	financialSummary: orgProcedure
		.input(reportIdInputSchema)
		.query(({ ctx, input }) =>
			reportService.financialSummary(toReportServiceContext(ctx), input),
		),

	create: orgProcedure
		.input(createReportSchema)
		.mutation(({ ctx, input }) =>
			reportService.create(toReportServiceContext(ctx), input),
		),

	update: reportProcedure("update")
		.input(updateReportSchema)
		.mutation(({ ctx, input }) =>
			reportService.update(toReportServiceContext(ctx), ctx.report, input),
		),

	delete: reportProcedure("delete").mutation(({ ctx }) =>
		reportService.remove(toReportServiceContext(ctx), ctx.report),
	),

	submit: reportProcedure("submit").mutation(({ ctx }) =>
		reportService.submit(toReportServiceContext(ctx), ctx.report),
	),

	transition: reportProcedure("transition")
		.input(transitionReportSchema)
		.mutation(({ ctx, input }) =>
			reportService.transition(toReportServiceContext(ctx), ctx.report, input),
		),

	exportToPdf: reportProcedure("read").mutation(({ ctx }) =>
		reportService.exportToPdf(toReportServiceContext(ctx), ctx.report),
	),
});

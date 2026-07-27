import { createTRPCRouter, orgAdminProcedure } from "@/server/api/trpc";
import {
	reportFiltersService,
	toReportFiltersServiceContext,
} from "@/server/modules/report-filters";

export const reportFiltersRouter = createTRPCRouter({
	options: orgAdminProcedure.query(({ ctx }) =>
		reportFiltersService.options(toReportFiltersServiceContext(ctx)),
	),
});

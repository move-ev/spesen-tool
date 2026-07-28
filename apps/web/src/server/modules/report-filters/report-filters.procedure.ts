import type { PrismaClient } from "@zemio/db";
import type { ReportFiltersContext } from "./report-filters.service";

type ReportFiltersRequestContext = {
	db: PrismaClient;
	organizationId: string;
};

export function toReportFiltersServiceContext(
	ctx: ReportFiltersRequestContext,
): ReportFiltersContext {
	return { db: ctx.db, organizationId: ctx.organizationId };
}

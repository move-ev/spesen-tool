"use client";

import type React from "react";
import { ReportList } from "@/components/report-list";
import { api } from "@/trpc/react";

export function OwnReportList({
	...props
}: Omit<React.ComponentProps<typeof ReportList>, "reports" | "reportRoute">) {
	const [reports] = api.report.getAll.useSuspenseQuery();

	return (
		<ReportList reportRoute={`/reports/:reportId`} reports={reports} {...props} />
	);
}

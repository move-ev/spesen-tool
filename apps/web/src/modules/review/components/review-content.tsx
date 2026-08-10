"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { ReportActivity } from "@/modules/report/components/report-activity";
import { api } from "@/trpc/react";
import { ReviewAttachments } from "./review-attachments";
import { ReviewExpenses } from "./review-expenses";
import { ExpensesHeader } from "./review-header";
import { ReviewNavbar } from "./review-navbar";
import { ReviewPaidNotice } from "./review-paid-notice";
import { ReviewSidebar } from "./review-sidebar";

function ReviewContent({
	className,
	reportId,
	...props
}: React.ComponentProps<"main"> & { reportId: string }) {
	const {
		data: review,
		error,
		isPending,
	} = api.report.review.useQuery({
		id: reportId,
	});
	const errorMessage = error?.message;

	return (
		<main className={cn("pb-32", className)} {...props}>
			<ReviewNavbar reportId={reportId} />
			<div className="flex flex-col xl:flex-row">
				<div className="mx-auto mt-12 w-full max-w-5xl grow px-8">
					<ReviewPaidNotice className="mb-8" reportId={reportId} />
					<ExpensesHeader reportId={reportId} />

					<ReviewExpenses
						className="mt-20"
						errorMessage={errorMessage}
						expenses={review?.expenses}
						loading={isPending}
						totalAmount={review?.totalAmount}
					/>
					<ReviewAttachments
						attachments={review?.attachments}
						className="mt-20"
						errorMessage={errorMessage}
						loading={isPending}
					/>
					<ReportActivity className="mt-20" reportId={reportId} />
				</div>
				<ReviewSidebar className="shrink-0" reportId={reportId} />
			</div>
		</main>
	);
}

export { ReviewContent };

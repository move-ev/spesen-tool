import type React from "react";
import type { Expense, Report } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { ReportCard, ReportCardField } from "./report-card";
import { Skeleton } from "./ui/skeleton";

export function ReportList({
	reports,
	reportRoute,
	className,
	...props
}: React.ComponentProps<"ul"> & {
	reports: (Report & { expenses: Expense[] })[];

	/**
	 * The route to the report details page. `:reportId` will be replaced
	 * with the actual report id.
	 */
	reportRoute: string;
}) {
	if (reports.length === 0) {
		return (
			<div
				className={cn(
					"rounded-lg border border-dashed p-12 text-center",
					className,
				)}
			>
				<p className="font-medium text-muted-foreground text-sm">
					Keine Anträge gefunden
				</p>
			</div>
		);
	}

	return (
		<ul
			className={cn(
				"grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3",
				className,
			)}
			{...props}
		>
			{reports.map((report) => {
				const reportTotal = report.expenses.reduce(
					(sum, expense) => sum + Number(expense.amount),
					0,
				);

				return (
					<li
						className="group/list-item relative isolate rounded-lg"
						key={report.id}
					>
						<ReportCard report={report} reportRoute={reportRoute}>
							<ReportCardField label="Gesamtbetrag" value={reportTotal.toFixed(2)} />
							<ReportCardField
								label="Anzahl Ausgaben"
								value={
									report.expenses.length === 0
										? "Keine Ausgaben"
										: report.expenses.length.toString()
								}
							/>
						</ReportCard>
					</li>
				);
			})}
		</ul>
	);
}

export function ReportListSkeleton({
	className,
	...props
}: React.ComponentProps<"ul">) {
	return (
		<ul
			className={cn(
				"grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3",
				className,
			)}
			{...props}
		>
			<li>
				<Skeleton className="h-32 w-full" />
			</li>
			<li>
				<Skeleton className="h-32 w-full" />
			</li>
			<li>
				<Skeleton className="h-32 w-full" />
			</li>
		</ul>
	);
}

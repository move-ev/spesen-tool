import { Button } from "@repo/ui/components/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import { FileSearchCornerIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import type { Report } from "@/generated/prisma/client";
import { ROUTES } from "@/lib/consts";
import type { ClientExpense } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReportCard, ReportCardField } from "./report-card";

type ReportWithExpenses = Report & { expenses: ClientExpense[] };

const ReportListItem = React.memo(function ReportListItem({
	report,
	reportRoute,
}: {
	report: ReportWithExpenses;
	reportRoute: string;
}) {
	const reportTotal = React.useMemo(
		() => report.expenses.reduce((sum, expense) => sum + expense.amount, 0),
		[report.expenses],
	);
	const expenseCountLabel =
		report.expenses.length === 0
			? "Keine Ausgaben"
			: report.expenses.length.toString();

	return (
		<li className="group/list-item relative isolate rounded-lg">
			<ReportCard report={report} reportRoute={reportRoute}>
				<ReportCardField
					label="Gesamtbetrag"
					value={`${reportTotal.toFixed(2)} €`}
				/>
				<ReportCardField label="Anzahl Ausgaben" value={expenseCountLabel} />
			</ReportCard>
		</li>
	);
});

export function ReportList({
	reports,
	reportRoute,
	className,
	...props
}: React.ComponentProps<"ul"> & {
	reports: ReportWithExpenses[];

	/**
	 * The route to the report details page. `:reportId` will be replaced
	 * with the actual report id.
	 */
	reportRoute: string;
}) {
	if (reports.length === 0) {
		return <ReportListEmpty />;
	}

	return (
		<ul
			className={cn(
				"grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3",
				className,
			)}
			{...props}
		>
			{reports.map((report) => (
				<ReportListItem key={report.id} report={report} reportRoute={reportRoute} />
			))}
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

export function ReportListEmpty({
	className,
	...props
}: React.ComponentProps<typeof Empty>) {
	return (
		<Empty className={cn("border", className)} {...props}>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<FileSearchCornerIcon />
				</EmptyMedia>
				<EmptyTitle>Keine Anträge gefunden</EmptyTitle>
				<EmptyDescription>
					Du hast noch keine Anträge erstellt. Stelle einen neuen Antrag um zu
					beginnen.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent className="flex-row justify-center gap-2">
				<Button
					nativeButton={false}
					render={
						<Link href={ROUTES.REPORT_NEW}>
							<PlusIcon />
							Neuer Antrag
						</Link>
					}
					size="sm"
				/>
			</EmptyContent>
		</Empty>
	);
}

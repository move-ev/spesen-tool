import { FileIcon, FileSearchCornerIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import type { Report } from "@/generated/prisma/client";
import { ROUTES } from "@/lib/consts";
import type { ClientExpense } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReportCard, ReportCardField } from "./report-card";
import { Button } from "./ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "./ui/empty";
import { Skeleton } from "./ui/skeleton";

export function ReportList({
	reports,
	reportRoute,
	className,
	...props
}: React.ComponentProps<"ul"> & {
	reports: (Report & { expenses: ClientExpense[] })[];

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
			{reports.map((report) => {
				const reportTotal = report.expenses.reduce(
					(sum, expense) => sum + expense.amount,
					0,
				);

				return (
					<li
						className="group/list-item relative isolate rounded-lg"
						key={report.id}
					>
						<ReportCard report={report} reportRoute={reportRoute}>
							<ReportCardField
								label="Gesamtbetrag"
								value={`${reportTotal.toFixed(2)} €`}
							/>
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

export function ReportListEmpty() {
	return (
		<Empty className="border">
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

"use client";

import { FileSearchCornerIcon } from "lucide-react";
import type React from "react";
import { ReportCard, ReportCardField } from "@/components/report-card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@repo/ui/components/empty";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export function RelevantReportList({
	className,
	...props
}: Omit<React.ComponentProps<"ul">, "children">) {
	const [reports] = api.admin.listRelevant.useSuspenseQuery();

	if (reports.length === 0) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FileSearchCornerIcon />
					</EmptyMedia>
					<EmptyTitle>Keine Anträge gefunden</EmptyTitle>
					<EmptyDescription>
						Hier werden Anträge angezeigt, die das letzte Mal in den letzten 30 Tagen
						bearbeitet wurden.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ul
			className={cn(
				"grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3",
				className,
			)}
			data-slot="relevant-report-list"
			{...props}
		>
			{reports.map((report) => {
				const reportTotal = report.expenses.reduce(
					(sum, expense) => sum + expense.amount,
					0,
				);

				return (
					<li key={report.id}>
						<ReportCard report={report} reportRoute={"/reports/:reportId"}>
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
							<ReportCardField label="Antragsteller" value={report.owner.name} />
						</ReportCard>
					</li>
				);
			})}
		</ul>
	);
}

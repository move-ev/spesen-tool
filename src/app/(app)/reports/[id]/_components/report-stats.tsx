"use client";

import {
	StatsCard,
	StatsCardDescription,
	StatsCardValue,
} from "@/components/stats-card";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export function ReportStats({
	className,
	reportId,
	...props
}: React.ComponentProps<"div"> & { reportId: string }) {
	const [stats] = api.report.getStats.useSuspenseQuery({ id: reportId });

	return (
		<div
			className={cn("grid gap-8 md:grid-cols-3", className)}
			data-slot="report-stats"
			{...props}
		>
			<StatsCard>
				<StatsCardDescription>Gesamtbetrag</StatsCardDescription>
				<StatsCardValue>{stats.totalAmount.toFixed(2)} €</StatsCardValue>
			</StatsCard>
			<StatsCard>
				<StatsCardDescription>Anzahl Ausgaben</StatsCardDescription>
				<StatsCardValue>{stats.expenseCount}</StatsCardValue>
			</StatsCard>
			<StatsCard>
				<StatsCardDescription>
					Lenny was kann man hier eintragen
				</StatsCardDescription>
				<StatsCardValue>🤔</StatsCardValue>
			</StatsCard>
		</div>
	);
}

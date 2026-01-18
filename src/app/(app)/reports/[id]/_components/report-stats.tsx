"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/components/ui/card";
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
			<Card>
				<CardContent className="space-y-2">
					<CardDescription>Gesamtbetrag</CardDescription>
					<CardTitle className="font-semibold text-2xl">
						{stats.totalAmount.toFixed(2)} €
					</CardTitle>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="space-y-2">
					<CardDescription>Anzahl Ausgaben</CardDescription>
					<CardTitle className="font-semibold text-2xl">
						{stats.expenseCount}
					</CardTitle>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="space-y-2">
					<CardDescription>Lenny was kann man hier eintragen</CardDescription>
					<CardTitle className="font-semibold text-2xl">🤔</CardTitle>
				</CardContent>
			</Card>
		</div>
	);
}

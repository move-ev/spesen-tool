"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ReportExpenseCard } from "./report-expense-card";

export function ReportExpensesList({
	className,
	reportId,
	...props
}: React.ComponentProps<"ul"> & { reportId: string }) {
	const [expenses] = api.expense.listForReport.useSuspenseQuery({
		reportId: reportId,
	});

	if (expenses.length === 0) {
		return (
			<div className={className} data-slot="report-expenses-list">
				<p className="text-center text-muted-foreground text-sm">
					Keine Ausgaben gefunden
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
			data-slot="report-expenses-list"
			{...props}
		>
			{expenses.map((expense) => (
				<li key={expense.id}>
					<ReportExpenseCard expense={expense} />
				</li>
			))}
		</ul>
	);
}

import { format } from "date-fns";
import type { Expense, Report } from "generated/prisma/client";
import Link from "next/link";
import type React from "react";
import { cn } from "@/lib/utils";
import { ReportStatusBadge } from "./report-status-badge";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
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
						<Card className="flex h-full flex-col transition-colors group-hover/list-item:bg-muted">
							<CardHeader>
								<div className="flex flex-col flex-wrap items-start justify-between gap-2 sm:flex-row sm:flex-wrap-reverse">
									<CardTitle className="order-2 sm:order-1">
										<Link
											className="group/list-item focus:outline-0"
											href={reportRoute.replace(":reportId", report.id)}
										>
											<span
												className={cn(
													"absolute inset-0 z-50 h-full w-full rounded-lg transition-colors",
													"group-focus/list-item:ring-2 group-focus/list-item:ring-ring group-focus/list-item:ring-offset-4 group-focus/list-item:ring-offset-background",
												)}
											/>
											{report.title}
										</Link>
									</CardTitle>
									<ReportStatusBadge className="sm:order-2" status={report.status} />
								</div>
								<CardDescription className="line-clamp-2">
									{report.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex-1 border-t pt-4">
								<dl className="grid gap-4">
									<div className="grid grid-cols-2">
										<dt className="text-muted-foreground text-sm">Gesamtbetrag</dt>
										<dd className="font-medium text-foreground text-sm">
											{reportTotal.toFixed(2)} €
										</dd>
									</div>
									<div className="grid grid-cols-2">
										<dt className="text-muted-foreground text-sm">Anzahl Ausgaben</dt>
										<dd className="font-medium text-foreground text-sm">
											{report.expenses.length === 0
												? "Keine Ausgaben"
												: report.expenses.length}
										</dd>
									</div>
								</dl>
							</CardContent>
							<CardFooter className="py-2">
								<span className="text-xs">
									Erstellt am {format(report.createdAt, "dd.MM.yyyy")} um{" "}
									{format(report.createdAt, "HH:mm")} Uhr
								</span>
							</CardFooter>
						</Card>
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

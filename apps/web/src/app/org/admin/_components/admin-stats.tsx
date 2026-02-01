"use client";

import { Button } from "@zemio/ui/components/button";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Period } from "@/server/services/stats.service";
import { api } from "@/trpc/react";
import {
	PeriodSelector,
	PeriodSelectorItem,
	usePeriodSelector,
} from "./period-selector";
import { StatusCard } from "./stats-card";

export function AdminStats({
	className,
	...props
}: React.ComponentProps<"div">) {
	const { period } = usePeriodSelector();

	const { data, isLoading, isPending, isRefetching, error, refetch } =
		api.organization.getStats.useQuery(
			{
				period,
			},
			{
				refetchOnMount: false,
			},
		);

	const isLoadingState = isLoading || isPending || isRefetching;

	// Error state
	if (error && !isLoadingState) {
		return (
			<div
				className={cn("rounded-lg border border-red-200 bg-red-50 p-6", className)}
			>
				<div className="flex items-start gap-3">
					<AlertCircle className="h-5 w-5 text-red-600" />
					<div className="flex-1">
						<h3 className="font-semibold text-red-900">
							Fehler beim Laden der Statistiken
						</h3>
						<p className="mt-1 text-red-700 text-sm">
							{error.message ?? "Ein unerwarteter Fehler ist aufgetreten"}
						</p>
						<Button
							className="mt-3"
							onClick={() => refetch()}
							size="sm"
							variant="outline"
						>
							Erneut versuchen
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("", className)} {...props}>
			<PeriodSelector>
				<PeriodSelectorItem value={Period.DAY}>24 Stunden</PeriodSelectorItem>
				<PeriodSelectorItem value={Period.WEEK}>Woche</PeriodSelectorItem>
				<PeriodSelectorItem value={Period.MONTH}>Monat</PeriodSelectorItem>
				<PeriodSelectorItem value={Period.YEAR}>Jahr</PeriodSelectorItem>
			</PeriodSelector>
			<div className="mt-4 grid gap-8 md:grid-cols-3">
				<StatusCard
					change={data?.reportsCreated.change}
					description="Anzahl eingereichter Anträge"
					inversedPositive
					loading={isLoadingState}
					value={data?.reportsCreated.current}
				/>
				<StatusCard
					change={data?.amountRequested.change}
					description="Gesamtbetrag aller Anträge"
					formatAsCurrency
					inversedPositive
					loading={isLoadingState}
					value={data?.amountRequested.current}
				/>
			</div>
		</div>
	);
}

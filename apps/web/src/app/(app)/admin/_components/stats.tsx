"use client";

import { Skeleton } from "@repo/ui/components/skeleton";
import {
	StatsCard,
	StatsCardDescription,
	StatsCardValue,
} from "@/components/stats-card";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export function AdminStats({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [stats] = api.admin.stats.useSuspenseQuery();

	return (
		<div
			className={cn("grid gap-8 md:grid-cols-3", className)}
			data-slot="admin-stats"
			{...props}
		>
			<StatsCard>
				<StatsCardDescription>Wartet auf Genehmigung</StatsCardDescription>
				<StatsCardValue>{stats.openCount}</StatsCardValue>
			</StatsCard>
			<StatsCard>
				<StatsCardDescription>Gesamtbetrag aller Anträge</StatsCardDescription>
				<StatsCardValue>{stats.totalAmount.toFixed(2)} €</StatsCardValue>
			</StatsCard>
			<StatsCard>
				<StatsCardDescription>Anzahl aller Anträge</StatsCardDescription>
				<StatsCardValue>{stats.totalCount}</StatsCardValue>
			</StatsCard>
		</div>
	);
}

export function AdminStatsSkeleton({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("grid gap-8 md:grid-cols-3", className)}
			data-slot="admin-stats skeleton"
			{...props}
		>
			<Skeleton className="h-24 w-full" />
			<Skeleton className="h-24 w-full" />
			<Skeleton className="h-24 w-full" />
		</div>
	);
}

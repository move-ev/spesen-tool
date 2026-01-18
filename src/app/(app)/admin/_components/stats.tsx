"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
			<Card>
				<CardContent className="space-y-2">
					<CardDescription>Wartet auf Genehmigung</CardDescription>
					<CardTitle className="font-semibold text-2xl">{stats.openCount}</CardTitle>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="space-y-2">
					<CardDescription>Gesamtbetrag aller Anträge</CardDescription>
					<CardTitle className="font-semibold text-2xl">
						{stats.totalAmount.toFixed(2)} €
					</CardTitle>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="space-y-2">
					<CardDescription>Anzahl aller Anträge</CardDescription>
					<CardTitle className="font-semibold text-2xl">
						{stats.totalCount}
					</CardTitle>
				</CardContent>
			</Card>
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
			data-slot="admin-stats"
			{...props}
		>
			<Skeleton className="h-24 w-full" />
			<Skeleton className="h-24 w-full" />
			<Skeleton className="h-24 w-full" />
		</div>
	);
}

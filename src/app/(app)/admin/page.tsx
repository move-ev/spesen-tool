import { Suspense } from "react";
import { PageDescription, PageTitle } from "@/components/page-title";
import { cn } from "@/lib/utils";
import { api, HydrateClient } from "@/trpc/server";
import { AdminStatsSkeleton } from "./_components/stats";
import { ReportsList } from "./data-display/reports-list";

export default async function ServerPage() {
	void api.admin.stats.prefetch();
	void api.admin.listOpen.prefetch();
	void api.admin.listRelevant.prefetch();

	return (
		<HydrateClient>
			<section
				className={cn(
					"container mt-12 flex flex-col flex-wrap items-start justify-start gap-4 sm:flex-row",
				)}
			>
				<div>
					<PageTitle>Admin Dashboard</PageTitle>
					<PageDescription className="mt-2">
						Verwalte deine Spesenanträge
					</PageDescription>
				</div>
			</section>
			<section className="mt-8">
				<Suspense fallback={<AdminStatsSkeleton />}>
					<ReportsList />
				</Suspense>
			</section>
		</HydrateClient>
	);
}

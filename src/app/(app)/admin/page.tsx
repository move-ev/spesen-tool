import { Suspense } from "react";
import { PageDescription, PageTitle } from "@/components/page-title";
import { ReportListSkeleton } from "@/components/report-list";
import { cn } from "@/lib/utils";
import { api, HydrateClient } from "@/trpc/server";
import { OpenReportList } from "./_components/open-report-list";
import { RelevantReportList } from "./_components/relevant-report-list";
import { AdminStats, AdminStatsSkeleton } from "./_components/stats";

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
			<section className="container mt-8">
				<Suspense fallback={<AdminStatsSkeleton />}>
					<AdminStats />
				</Suspense>
			</section>
			<section className="container mt-12">
				<h2 className="mb-6 font-semibold">Offene Anträge</h2>
				<Suspense fallback={<ReportListSkeleton />}>
					<OpenReportList />
				</Suspense>
			</section>
			<section className="container my-12">
				<h2 className="mb-6 font-semibold">Bearbeitete Anträge</h2>
				<Suspense fallback={<ReportListSkeleton />}>
					<RelevantReportList />
				</Suspense>
			</section>
		</HydrateClient>
	);
}

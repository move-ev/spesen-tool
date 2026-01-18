import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";
import { PageDescription, PageTitle } from "@/components/page-title";
import { ReportListSkeleton } from "@/components/report-list";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/consts";
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
				<div className="me-auto">
					<PageTitle>Admin Dashboard</PageTitle>
					<PageDescription className="mt-2">
						Verwalte deine Spesenanträge
					</PageDescription>
				</div>
				<div className="flex w-full flex-col flex-wrap gap-4 sm:mt-1 sm:w-fit sm:flex-row">
					<Button
						className={"w-full sm:w-fit"}
						nativeButton={false}
						render={
							<Link href={ROUTES.USER_DASHBOARD}>
								<ArrowLeftIcon />
								Zurück
							</Link>
						}
						variant={"outline"}
					/>
					<Button
						className={"w-full sm:w-fit"}
						nativeButton={false}
						render={
							<Link href={ROUTES.ADMIN_SETTINGS}>
								<SettingsIcon />
								Einstellungen
							</Link>
						}
						variant={"outline"}
					/>
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

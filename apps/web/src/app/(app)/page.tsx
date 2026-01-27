import { Button } from "@zemio/ui/components/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageDescription, PageTitle } from "@/components/page-title";
import { ReportListSkeleton } from "@/components/report-list";
import { ROUTES } from "@/lib/consts";
import { cn } from "@/lib/utils";
import { api, HydrateClient } from "@/trpc/server";
import { OwnReportList } from "./_components/own-report-list";

export default async function ServerPage() {
	void api.report.getAll.prefetch();

	return (
		<HydrateClient>
			<div className="mt-12">
				<section
					className={cn(
						"container flex flex-col flex-wrap items-start justify-start gap-4 sm:flex-row",
					)}
				>
					<div className="me-auto">
						<PageTitle>Spesenübersicht</PageTitle>
						<PageDescription className="mt-2">
							Verwalte deine Spesenanträge
						</PageDescription>
					</div>
					<div className="flex w-full flex-col flex-wrap gap-4 sm:mt-1 sm:w-fit sm:flex-row">
						<Button
							className={"w-full sm:w-fit"}
							nativeButton={false}
							render={
								<Link href={ROUTES.REPORT_NEW}>
									<PlusIcon />
									Neuer Spesenantrag
								</Link>
							}
							variant={"default"}
						/>
					</div>
				</section>
				<section className="container mt-12">
					<h2 className="mb-6 font-semibold">Deine Anträge</h2>
					<Suspense fallback={<ReportListSkeleton />}>
						<OwnReportList />
					</Suspense>
				</section>
			</div>
		</HydrateClient>
	);
}

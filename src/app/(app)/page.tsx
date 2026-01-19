import { PlusIcon, SettingsIcon, ShieldUserIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";
import { PageDescription, PageTitle } from "@/components/page-title";
import { ReportListSkeleton } from "@/components/report-list";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/consts";
import { cn } from "@/lib/utils";
import { auth } from "@/server/better-auth";
import { api, HydrateClient } from "@/trpc/server";
import { OwnReportList } from "./_components/own-report-list";

export default async function ServerPage() {
	const res = await auth.api.getSession({
		headers: await headers(),
	});

	if (!res?.user) {
		redirect(ROUTES.AUTH);
	}

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
						{res.user.role === "admin" && (
							<React.Fragment>
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
								<Button
									className={"w-full sm:w-fit"}
									nativeButton={false}
									render={
										<Link href={ROUTES.ADMIN_DASHBOARD}>
											<ShieldUserIcon />
											Admin Dashboard
										</Link>
									}
									variant={"outline"}
								/>
							</React.Fragment>
						)}
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

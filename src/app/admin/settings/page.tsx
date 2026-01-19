import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSettingsForm } from "@/components/forms/admin-settings-form";
import { PageDescription, PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/consts";
import { api, HydrateClient } from "@/trpc/server";

export default async function ServerPage() {
	void api.settings.get.prefetch();

	return (
		<HydrateClient>
			<section className="container mt-12 max-w-4xl">
				<Button
					className={"-ms-2"}
					nativeButton={false}
					render={
						<Link href={ROUTES.USER_DASHBOARD}>
							<ArrowLeftIcon />
							Zurück zur Übersicht
						</Link>
					}
					variant={"ghost"}
				/>
				<PageTitle className="mt-8">Admin-Einstellungen</PageTitle>
				<PageDescription className="mt-2">
					Verwalte globale Einstellungen für das Spesen-Tool
				</PageDescription>
			</section>
			<section className="container mt-10 max-w-4xl">
				<Suspense fallback={<Skeleton className="h-32 w-full" />}>
					<AdminSettingsForm />
				</Suspense>
			</section>
		</HydrateClient>
	);
}

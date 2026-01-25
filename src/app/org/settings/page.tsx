import { Suspense } from "react";
import { OrganizationGeneralSettingsForm } from "@/components/forms/org/org-general-form";
import { PageTitle } from "@/components/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import { api, HydrateClient } from "@/trpc/server";

export default async function Page() {
	void api.organization.get.prefetch({});

	return (
		<HydrateClient>
			<section>
				<PageTitle>Allgemeine Einstellungen</PageTitle>
			</section>
			<section className="mt-12">
				<div className="rounded-xl border border-border bg-background p-8 shadow-xs">
					<Suspense fallback={<Skeleton className="h-32 w-full" />}>
						<OrganizationGeneralSettingsForm />
					</Suspense>
				</div>
			</section>
		</HydrateClient>
	);
}

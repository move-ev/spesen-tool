import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import { api, HydrateClient } from "@/trpc/server";
import { UserList } from "./_components/user-list";

export default async function ServerPage() {
	void api.settings.listUsers.prefetch();

	return (
		<HydrateClient>
			<section>
				<PageTitle>Benutzer</PageTitle>
			</section>
			<section className="mt-12">
				<p className="mb-6 font-semibold">Benutzer</p>
				<Suspense fallback={<Skeleton className="h-32 w-full" />}>
					<UserList />
				</Suspense>
			</section>
		</HydrateClient>
	);
}

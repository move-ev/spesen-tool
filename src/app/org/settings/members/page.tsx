import { UserPlusIcon } from "lucide-react";
import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { api, HydrateClient } from "@/trpc/server";
import { CreateInvite } from "./_components/create-invite";
import { PendingInvitesList } from "./pending-invites-list";

export default async function Page() {
	void api.invitation.listPending.prefetch();

	return (
		<HydrateClient>
			<section>
				<PageTitle>Mitglieder</PageTitle>
			</section>
			<section className="mt-12">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<p className="font-semibold text-lg">Ausstehende Einladungen</p>
					<CreateInvite variant={"outline"}>
						<UserPlusIcon /> Mitglieder einladen
					</CreateInvite>
				</div>
				<div className="mt-6 rounded-lg border border-border shadow-xs">
					<Suspense>
						<PendingInvitesList />
					</Suspense>
				</div>
			</section>
		</HydrateClient>
	);
}

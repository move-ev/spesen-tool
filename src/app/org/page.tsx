import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageDescription, PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/consts";
import { auth } from "@/server/better-auth";
import { HydrateClient } from "@/trpc/server";
import {
	SuggestedOrganization,
	SuggestedOrganizationLoading,
} from "./components/suggested-organization";

export default async function ServerPage() {
	const user = await auth.api.getSession({
		headers: await headers(),
	});

	if (!user) {
		redirect(ROUTES.AUTH);
	}

	return (
		<HydrateClient>
			<main>
				<section className="container max-w-2xl py-20">
					<PageTitle>Willkommen zurück!</PageTitle>
					<PageDescription className="mt-2">
						Um über das Spesentool gemeinsam mit anderen zu arbeiten, musst du
						Mitglied in einer Organisation sein. Trete entweder einer bestehenden
						Organisation bei oder erstelle deine Eigene.
					</PageDescription>
					<div className="mt-8">
						<Suspense fallback={<SuggestedOrganizationLoading />}>
							<SuggestedOrganization />
						</Suspense>
					</div>
					<div
						className={
							"mt-8 flex items-center justify-between gap-4 rounded-lg border p-4"
						}
					>
						<div>
							<h2 className="font-medium">Nichts das wonach du suchst?</h2>
							<p className="mt-1 text-muted-foreground text-xs">
								Wenn keine passende Organisation gefunden wurde, kannst du eine neue
								erstellen.
							</p>
						</div>
						<Button variant={"outline"}>Neue Organisation erstellen</Button>
					</div>
				</section>
			</main>
		</HydrateClient>
	);
}

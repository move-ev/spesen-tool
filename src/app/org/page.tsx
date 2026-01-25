import { HeartHandshakeIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CreateOrganizationForm } from "@/components/forms/create-organization-form";
import { PageDescription, PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
			<main className="flex min-h-svh items-center justify-center bg-muted py-20">
				<section className="container max-w-2xl rounded-lg border bg-background px-10 py-12 shadow-xs">
					<PageTitle className="flex items-center gap-2">
						<HeartHandshakeIcon className="text-primary" />
						Willkommen zurück!
					</PageTitle>
					<PageDescription className="mt-2">
						Um über das Spesentool gemeinsam mit anderen arbeiten zu können, musst du
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
						<Dialog>
							<DialogTrigger
								render={
									<Button variant={"outline"}>Neue Organisation erstellen</Button>
								}
							/>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Neue Organisation erstellen</DialogTitle>
								</DialogHeader>
								<DialogDescription>
									Erstelle eine neue Organisation um mehrere Nutzer zu verwalten.
								</DialogDescription>
								<CreateOrganizationForm />
							</DialogContent>
						</Dialog>
					</div>
				</section>
			</main>
		</HydrateClient>
	);
}

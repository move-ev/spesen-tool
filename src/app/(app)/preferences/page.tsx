import { PreferencesForm } from "@/components/forms/preferences-form";
import { PageDescription, PageTitle } from "@/components/page-title";
import { api, HydrateClient } from "@/trpc/server";

export default async function ServerPage() {
	void api.preferences.getOwn.prefetch();

	return (
		<HydrateClient>
			<section className="container mt-12">
				<PageTitle>Einstellungen</PageTitle>
				<PageDescription className="mt-2">
					Verwalte deine persönlichen Einstellungen
				</PageDescription>
			</section>
			<section className="container mt-12">
				<PreferencesForm />
			</section>
		</HydrateClient>
	);
}

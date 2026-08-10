import { AdminSettingsOrgs } from "@/modules/settings/";
import { api, HydrateClient } from "@/trpc/server";

export default async function ServerPage() {
	await Promise.all([api.platformAdmin.organizations.list.prefetch()]);

	return (
		<HydrateClient>
			<AdminSettingsOrgs />
		</HydrateClient>
	);
}

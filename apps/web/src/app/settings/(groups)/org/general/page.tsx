import { OrgSettingsGeneral } from "@/modules/settings/components";
import { api, HydrateClient } from "@/trpc/server";

export default async function ServerPage(
	_props: PageProps<"/settings/org/general">,
) {
	await Promise.all([
		api.organization.get.prefetch(),
		api.settings.get.prefetch(),
	]);

	return (
		<HydrateClient>
			<OrgSettingsGeneral />
		</HydrateClient>
	);
}

import { AdminOrgDetails } from "@/modules/settings/";
import { api, HydrateClient } from "@/trpc/server";

export default async function ServerPage(
	props: PageProps<"/settings/admin/orgs/[id]">,
) {
	const { id } = await props.params;

	await Promise.all([api.platformAdmin.organizations.byId.prefetch({ id })]);

	return (
		<HydrateClient>
			<AdminOrgDetails organizationId={id} />
		</HydrateClient>
	);
}

import { createLoader, parseAsString } from "nuqs/server";
import { COST_UNITS_PAGE_SIZE, OrgSettingsCostUnits } from "@/modules/settings";
import { api, HydrateClient } from "@/trpc/server";

const loadSearchParams = createLoader({
	search: parseAsString,
});

export default async function ServerPage(
	props: PageProps<"/settings/org/cost-units">,
) {
	const searchParams = await props.searchParams;
	const params = loadSearchParams(searchParams);

	// Must match the grid's initial query input exactly, or the prefetched entry
	// is never read and the client refetches on mount.
	await Promise.all([
		api.costUnit.list.prefetch({
			page: 1,
			pageSize: COST_UNITS_PAGE_SIZE,
			search: params.search ?? undefined,
			filters: undefined,
			sorting: undefined,
		}),
		api.costUnit.groups.list.prefetch(),
	]);

	return (
		<HydrateClient>
			<OrgSettingsCostUnits />
		</HydrateClient>
	);
}

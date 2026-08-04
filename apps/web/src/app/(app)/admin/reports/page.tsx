import { ADMIN_REPORTS_PAGE_SIZE, AdminContent } from "@/modules/admin";
import { api, HydrateClient } from "@/trpc/server";

export default async function ServerPage() {
	// Prefetch filter options and first page of reports in parallel
	void api.reportFilters.options.prefetch();
	void api.report.list.prefetch({
		scope: "all",
		page: 1,
		pageSize: ADMIN_REPORTS_PAGE_SIZE,
	});

	return (
		<HydrateClient>
			<AdminContent />
		</HydrateClient>
	);
}

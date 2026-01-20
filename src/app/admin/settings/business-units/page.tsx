import { PlusIcon } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { api, HydrateClient } from "@/trpc/server";
import { BusinessUnitsTable } from "./_components/business-units-table";
import { CreateBusinessUnit } from "./_components/create-business-unit";

export default async function ServerPage() {
	void api.businessUnit.listAll.prefetch();

	return (
		<HydrateClient>
			<section className="flex flex-wrap justify-between gap-4">
				<PageTitle>Geschäftseinheiten</PageTitle>
				<CreateBusinessUnit variant={"outline"}>
					<PlusIcon />
					Neue Geschäftseinheit
				</CreateBusinessUnit>
			</section>
			<section className="mt-12">
				<BusinessUnitsTable />
			</section>
		</HydrateClient>
	);
}

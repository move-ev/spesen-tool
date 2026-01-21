import { PlusIcon } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { api, HydrateClient } from "@/trpc/server";
import { AccountingUnitsTable } from "./_components/accounting-units-table";
import { CreateAccountingUnit } from "./_components/create-accounting-unit";

export default async function ServerPage() {
	void api.accountingUnit.listAll.prefetch();

	return (
		<HydrateClient>
			<section className="flex flex-wrap justify-between gap-4">
				<PageTitle>Buchungskreise</PageTitle>
				<CreateAccountingUnit variant={"outline"}>
					<PlusIcon />
					Neuer Buchungskreis
				</CreateAccountingUnit>
			</section>
			<section className="mt-12">
				<AccountingUnitsTable />
			</section>
		</HydrateClient>
	);
}

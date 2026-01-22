import { BoxesIcon, PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import { api, HydrateClient } from "@/trpc/server";
import { CreateCostUnit } from "./components/create-cost-unit";
import { CreateCostUnitGroup } from "./components/create-cost-unit-group";

export default async function ServerPage() {
	void api.costUnit.listGrouped.prefetch();
	void api.costUnit.listGroups.prefetch();

	return (
		<HydrateClient>
			<section className="flex flex-col flex-wrap items-center justify-start gap-4 sm:flex-row">
				<PageTitle className="me-auto">Kostenstellen</PageTitle>
				<div className="flex w-full gap-4 sm:w-fit">
					<CreateCostUnitGroup className="w-full sm:w-fit" variant={"outline"}>
						<BoxesIcon /> Neue Gruppe
					</CreateCostUnitGroup>
					<Suspense fallback={<Skeleton className="h-8 w-full sm:w-41" />}>
						<CreateCostUnit className="w-full sm:w-fit">
							<PlusIcon /> Neue Kostenstelle
						</CreateCostUnit>
					</Suspense>
				</div>
			</section>
		</HydrateClient>
	);
}

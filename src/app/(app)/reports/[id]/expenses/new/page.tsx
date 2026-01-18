import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSettingsForm } from "@/components/forms/admin-settings-form";
import { CreateReceiptExpenseForm } from "@/components/forms/expense/receipt";
import { CreateTravelExpenseForm } from "@/components/forms/expense/travel";
import { PageDescription, PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/lib/consts";
import { api, HydrateClient } from "@/trpc/server";

export default async function ServerPage({
	params,
}: PageProps<"/reports/[id]/expenses/new">) {
	const { id: reportId } = await params;

	return (
		<HydrateClient>
			<section className="container mt-12 max-w-4xl">
				<Button
					className={"-ms-2"}
					nativeButton={false}
					render={
						<Link href={ROUTES.REPORT_DETAIL(reportId)}>
							<ArrowLeftIcon />
							Zurück zum Report
						</Link>
					}
					variant={"ghost"}
				/>
				<PageTitle className="mt-8">Ausgabe hinzufügen</PageTitle>
				<PageDescription className="mt-2">
					Füge deinem Report eine neue Ausgabe hinzu
				</PageDescription>
			</section>
			<section className="container mt-10 max-w-4xl">
				<Tabs>
					<TabsList className={"w-full"}>
						<TabsTrigger value="receipt">Beleg</TabsTrigger>
						<TabsTrigger value="travel">Reise</TabsTrigger>
						<TabsTrigger value="food">Verpflegung</TabsTrigger>
					</TabsList>
					<div>
						<TabsContent value="receipt">
							<CreateReceiptExpenseForm reportId={reportId} />
						</TabsContent>
						<TabsContent value="travel">
							<CreateTravelExpenseForm reportId={reportId} />
						</TabsContent>
					</div>
				</Tabs>
			</section>
		</HydrateClient>
	);
}

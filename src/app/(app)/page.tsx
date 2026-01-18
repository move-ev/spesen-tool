import { DockIcon, PlusIcon } from "lucide-react";
import { CreateReport } from "@/components/create-report";
import { ReportList } from "@/components/report-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/lib/consts";
import { api } from "@/trpc/server";

export default async function ServerPage() {
	const reports = await api.report.listOwn();

	return (
		<main>
			<section className="py-12">
				<header className="container flex flex-wrap items-center justify-between gap-6">
					<div className="flex flex-col gap-2">
						<h1 className="font-medium text-xl">Willkommen zurück!</h1>
						<p className="text-muted-foreground text-sm">
							Hier ist eine Übersicht über alle deine Reports.
						</p>
					</div>
					<div>
						<CreateReport>
							<PlusIcon />
							Neuer Report
						</CreateReport>
					</div>
				</header>
			</section>
			<section>
				<Tabs>
					<div className="container">
						<TabsList variant={"line"}>
							<TabsTrigger value="all">
								<DockIcon /> Alle Reports
							</TabsTrigger>
						</TabsList>
					</div>
					<div className="container mt-6 sm:px-2 lg:px-4">
						<TabsContent value="all">
							<ReportList reportRoute={ROUTES.USER_REPORT} reports={reports} />
						</TabsContent>
					</div>
				</Tabs>
			</section>
		</main>
	);
}

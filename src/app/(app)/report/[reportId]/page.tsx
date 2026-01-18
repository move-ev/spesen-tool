import { format } from "date-fns";
import { ArrowLeftIcon, ChevronDownIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddExpense } from "@/components/add-expense";
import { Link } from "@/components/link";
import { ROUTES } from "@/lib/consts";
import { api, HydrateClient } from "@/trpc/server";
import { ExpenseList } from "./components/expense-list";

export default async function ServerPage({
	params,
}: PageProps<"/report/[reportId]">) {
	const { reportId } = await params;

	const report = await api.report.get({ id: reportId });

	if (!report) {
		notFound();
	}

	void api.expense.list.prefetch({ reportId });

	return (
		<HydrateClient>
			<main className="py-12">
				<section>
					<div className="container">
						<Link
							className="gap-1.5 font-medium text-foreground text-sm"
							href={ROUTES.USER_DASHBOARD}
						>
							<ArrowLeftIcon className="size-4 text-muted-foreground" /> Zurück
						</Link>
					</div>
					<div className="container mt-8">
						<div>
							<h1 className="font-medium text-2xl">{report.title}</h1>
							<p className="mt-2 text-muted-foreground text-sm">
								Erstellt am {format(report.createdAt, "dd.MM.yyyy")} um{" "}
								{format(report.createdAt, "HH:mm")} Uhr
							</p>
						</div>
					</div>
				</section>

				<section className="container mt-12">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<h2 className="font-medium text-lg">Ausgaben</h2>
						<AddExpense reportId={reportId} variant={"outline"}>
							Ausgabe hinzufügen <ChevronDownIcon />
						</AddExpense>
					</div>
					<div className="mt-6">
						<Suspense fallback={<div>Loading...</div>}>
							<ExpenseList reportId={reportId} />
						</Suspense>
					</div>
				</section>
			</main>
		</HydrateClient>
	);
}

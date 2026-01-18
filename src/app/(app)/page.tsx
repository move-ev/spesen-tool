"use client";

import Link from "next/link";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/consts";
import { ReportStatus } from "@/lib/enums";
import { Plus, Settings } from "lucide-react";

const statusLabels: Record<ReportStatus, string> = {
	DRAFT: "Entwurf",
	PENDING_APPROVAL: "Wartet auf Genehmigung",
	NEEDS_REVISION: "Benötigt Überarbeitung",
	ACCEPTED: "Akzeptiert",
	REJECTED: "Abgelehnt",
};

const statusVariants: Record<ReportStatus, "default" | "success" | "destructive" | "warning"> = {
	DRAFT: "default",
	PENDING_APPROVAL: "warning",
	NEEDS_REVISION: "warning",
	ACCEPTED: "success",
	REJECTED: "destructive",
};

export default function DashboardPage() {
	const { data: reports, isLoading } = api.report.getAll.useQuery();
	const { data: currentUser } = api.user.getCurrent.useQuery();

	const totalAmount = reports?.reduce((sum, report) => {
		const reportTotal = report.expenses.reduce(
			(expenseSum, expense) => expenseSum + Number(expense.amount),
			0,
		);
		return sum + reportTotal;
	}, 0) ?? 0;

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold">Spesenübersicht</h1>
					<p className="text-muted-foreground mt-2">
						Verwalte deine Spesenanträge
					</p>
				</div>
				<div className="flex gap-2">
					{currentUser?.admin === true && (
						<>
							<Link href={ROUTES.ADMIN_DASHBOARD}>
								<Button variant="outline">
									Admin Dashboard
								</Button>
							</Link>
							<Link href={ROUTES.ADMIN_SETTINGS}>
								<Button variant="outline">
									<Settings className="mr-2 h-4 w-4" />
									Einstellungen
								</Button>
							</Link>
						</>
					)}
					<Link href={ROUTES.REPORT_NEW}>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Neuer Antrag
						</Button>
					</Link>
				</div>
			</div>

			{isLoading ? (
				<div className="text-center py-12">Lade...</div>
			) : reports && reports.length > 0 ? (
				<>
					<div className="mb-6">
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">
											Gesamtbetrag
										</p>
										<p className="text-2xl font-bold">
											{totalAmount.toFixed(2)} €
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Anzahl Anträge
										</p>
										<p className="text-2xl font-bold">{reports.length}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{reports.map((report) => {
							const reportTotal = report.expenses.reduce(
								(sum, expense) => sum + Number(expense.amount),
								0,
							);

							return (
								<Link
									key={report.id}
									href={ROUTES.REPORT_DETAIL(report.id)}
									className="block"
								>
									<Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
										<CardHeader>
											<div className="flex items-start justify-between">
												<CardTitle className="text-lg">
													{report.title}
												</CardTitle>
												<Badge variant={statusVariants[report.status]}>
													{statusLabels[report.status]}
												</Badge>
											</div>
											{report.description && (
												<CardDescription>
													{report.description}
												</CardDescription>
											)}
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Anzahl Ausgaben:
													</span>
													<span className="font-medium">
														{report.expenses.length}
													</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Gesamtbetrag:
													</span>
													<span className="font-bold">
														{reportTotal.toFixed(2)} €
													</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Erstellt:
													</span>
													<span>
														{new Date(report.createdAt).toLocaleDateString(
															"de-DE",
														)}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								</Link>
							);
						})}
					</div>
				</>
			) : (
				<Card>
					<CardContent className="pt-6 text-center">
						<p className="text-muted-foreground mb-4">
							Noch keine Spesenanträge vorhanden.
						</p>
						<Link href={ROUTES.REPORT_NEW}>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Ersten Antrag erstellen
							</Button>
						</Link>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

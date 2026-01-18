"use client";

import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/consts";
import type { ReportStatus } from "@/lib/enums";
import { api } from "@/trpc/react";

const statusLabels: Record<ReportStatus, string> = {
	DRAFT: "Entwurf",
	PENDING_APPROVAL: "Wartet auf Genehmigung",
	NEEDS_REVISION: "Benötigt Überarbeitung",
	ACCEPTED: "Akzeptiert",
	REJECTED: "Abgelehnt",
};

const statusVariants: Record<
	ReportStatus,
	"default" | "success" | "destructive" | "warning"
> = {
	DRAFT: "default",
	PENDING_APPROVAL: "warning",
	NEEDS_REVISION: "warning",
	ACCEPTED: "success",
	REJECTED: "destructive",
};

export default function AdminDashboardPage() {
	const { data: reports, isLoading, error } = api.admin.getAllReports.useQuery();

	// Filter reports by status
	// Use string comparison to ensure compatibility with database values
	const pendingReports =
		reports?.filter((r) => r.status === "PENDING_APPROVAL") ?? [];
	const allReports = reports ?? [];

	const totalAmount = allReports.reduce((sum, report) => {
		const reportTotal = report.expenses.reduce(
			(expenseSum, expense) => expenseSum + Number(expense.amount),
			0,
		);
		return sum + reportTotal;
	}, 0);

	const pendingAmount = pendingReports.reduce((sum, report) => {
		const reportTotal = report.expenses.reduce(
			(expenseSum, expense) => expenseSum + Number(expense.amount),
			0,
		);
		return sum + reportTotal;
	}, 0);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Admin Dashboard</h1>
					<p className="mt-2 text-muted-foreground">
						Übersicht über alle Spesenanträge
					</p>
				</div>
				<div className="flex gap-2">
					<Link href={ROUTES.USER_DASHBOARD}>
						<Button variant="outline">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Zurück
						</Button>
					</Link>
					<Link href={ROUTES.ADMIN_SETTINGS}>
						<Button variant="outline">
							<Settings className="mr-2 h-4 w-4" />
							Einstellungen
						</Button>
					</Link>
				</div>
			</div>

			{error && (
				<Card className="mb-6 border-destructive">
					<CardContent className="pt-6">
						<p className="text-destructive">
							Fehler beim Laden der Reports: {error.message}
						</p>
					</CardContent>
				</Card>
			)}
			{isLoading ? (
				<div className="py-12 text-center">Lade...</div>
			) : (
				<>
					<div className="mb-6 grid gap-4 md:grid-cols-3">
						<Card>
							<CardContent className="pt-6">
								<div>
									<p className="text-muted-foreground text-sm">Wartet auf Genehmigung</p>
									<p className="font-bold text-2xl">{pendingReports.length}</p>
									<p className="mt-1 text-muted-foreground text-sm">
										{pendingAmount.toFixed(2)} €
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div>
									<p className="text-muted-foreground text-sm">
										Gesamtbetrag aller Anträge
									</p>
									<p className="font-bold text-2xl">{totalAmount.toFixed(2)} €</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div>
									<p className="text-muted-foreground text-sm">Anzahl aller Anträge</p>
									<p className="font-bold text-2xl">{allReports.length}</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{pendingReports.length > 0 && (
						<div className="mb-6">
							<h2 className="mb-4 font-semibold text-xl">
								Wartet auf Genehmigung ({pendingReports.length})
							</h2>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{pendingReports.map((report) => {
									const reportTotal = report.expenses.reduce(
										(sum, expense) => sum + Number(expense.amount),
										0,
									);

									return (
										<Link
											className="block"
											href={ROUTES.REPORT_DETAIL(report.id)}
											key={report.id}
										>
											<Card className="h-full cursor-pointer border-warning transition-shadow hover:shadow-lg">
												<CardHeader>
													<div className="flex items-start justify-between">
														<CardTitle className="text-lg">{report.title}</CardTitle>
														<Badge variant={statusVariants[report.status]}>
															{statusLabels[report.status]}
														</Badge>
													</div>
													{report.description && (
														<CardDescription>{report.description}</CardDescription>
													)}
													<CardDescription className="mt-1">
														Von: {report.owner.name} ({report.owner.email})
													</CardDescription>
												</CardHeader>
												<CardContent>
													<div className="space-y-2">
														<div className="flex justify-between text-sm">
															<span className="text-muted-foreground">Anzahl Ausgaben:</span>
															<span className="font-medium">{report.expenses.length}</span>
														</div>
														<div className="flex justify-between text-sm">
															<span className="text-muted-foreground">Gesamtbetrag:</span>
															<span className="font-bold">{reportTotal.toFixed(2)} €</span>
														</div>
														<div className="flex justify-between text-sm">
															<span className="text-muted-foreground">Erstellt:</span>
															<span>
																{new Date(report.createdAt).toLocaleDateString("de-DE")}
															</span>
														</div>
													</div>
												</CardContent>
											</Card>
										</Link>
									);
								})}
							</div>
						</div>
					)}

					<div>
						<h2 className="mb-4 font-semibold text-xl">Alle Anträge</h2>
						{allReports.length > 0 ? (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{allReports.map((report) => {
									const reportTotal = report.expenses.reduce(
										(sum, expense) => sum + Number(expense.amount),
										0,
									);

									return (
										<Link
											className="block"
											href={ROUTES.REPORT_DETAIL(report.id)}
											key={report.id}
										>
											<Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
												<CardHeader>
													<div className="flex items-start justify-between">
														<CardTitle className="text-lg">{report.title}</CardTitle>
														<Badge variant={statusVariants[report.status]}>
															{statusLabels[report.status]}
														</Badge>
													</div>
													{report.description && (
														<CardDescription>{report.description}</CardDescription>
													)}
													<CardDescription className="mt-1">
														Von: {report.owner.name} ({report.owner.email})
													</CardDescription>
												</CardHeader>
												<CardContent>
													<div className="space-y-2">
														<div className="flex justify-between text-sm">
															<span className="text-muted-foreground">Anzahl Ausgaben:</span>
															<span className="font-medium">{report.expenses.length}</span>
														</div>
														<div className="flex justify-between text-sm">
															<span className="text-muted-foreground">Gesamtbetrag:</span>
															<span className="font-bold">{reportTotal.toFixed(2)} €</span>
														</div>
														<div className="flex justify-between text-sm">
															<span className="text-muted-foreground">Erstellt:</span>
															<span>
																{new Date(report.createdAt).toLocaleDateString("de-DE")}
															</span>
														</div>
													</div>
												</CardContent>
											</Card>
										</Link>
									);
								})}
							</div>
						) : (
							<Card>
								<CardContent className="pt-6 text-center">
									<p className="text-muted-foreground">
										Noch keine Spesenanträge vorhanden.
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</>
			)}
		</div>
	);
}

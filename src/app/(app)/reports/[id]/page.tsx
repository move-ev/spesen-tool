"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportStatus, ExpenseType } from "@/lib/enums";
import { ArrowLeft, Plus, Check, X, Edit } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ROUTES } from "@/lib/consts";

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

const expenseTypeLabels: Record<ExpenseType, string> = {
	RECEIPT: "Beleg",
	TRAVEL: "Reise",
	FOOD: "Verpflegung",
};

export default function ReportDetailPage() {
	const params = useParams();
	const router = useRouter();
	const reportId = params.id as string;

	const { data: currentUser } = api.user.getCurrent.useQuery();
	const isAdmin = currentUser?.admin === true;

	// Use admin endpoint if user is admin, otherwise use regular endpoint
	const { data: report, isLoading, refetch } = isAdmin
		? api.admin.getReportById.useQuery(
				{ id: reportId },
				{ enabled: !!reportId },
			)
		: api.report.getById.useQuery({ id: reportId }, { enabled: !!reportId });

	const updateStatusMutation = isAdmin
		? api.admin.updateReportStatus.useMutation({
				onSuccess: () => {
					toast.success("Status aktualisiert");
					refetch();
				},
				onError: (error) => {
					toast.error(
						error.message || "Fehler beim Aktualisieren des Status",
					);
				},
			})
		: api.report.updateStatus.useMutation({
				onSuccess: () => {
					toast.success("Status aktualisiert");
					refetch();
				},
				onError: (error) => {
					toast.error(
						error.message || "Fehler beim Aktualisieren des Status",
					);
				},
			});

	const handleStatusChange = (status: ReportStatus) => {
		updateStatusMutation.mutate({ id: reportId, status });
	};

	if (isLoading) {
		return (
			<div className="container mx-auto py-8 px-4">
				<div className="text-center py-12">Lade...</div>
			</div>
		);
	}

	if (!report) {
		return (
			<div className="container mx-auto py-8 px-4">
				<div className="text-center py-12">Report nicht gefunden</div>
			</div>
		);
	}

	const totalAmount = report.expenses.reduce(
		(sum, expense) => sum + Number(expense.amount),
		0,
	);

	const backUrl = isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.USER_DASHBOARD;

	return (
		<div className="container mx-auto py-8 px-4">
			<Link href={backUrl}>
				<Button variant="ghost" className="mb-6">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Zurück zur Übersicht
				</Button>
			</Link>

			<div className="mb-6">
				<Card>
					<CardHeader>
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="text-2xl">{report.title}</CardTitle>
								{report.description && (
									<CardDescription className="mt-2">
										{report.description}
									</CardDescription>
								)}
							</div>
							<Badge variant={statusVariants[report.status]} className="text-sm">
								{statusLabels[report.status]}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
							<div>
								<p className="text-sm text-muted-foreground">
									IBAN
								</p>
								<p className="font-medium">{report.businessUnit}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									Buchungskreis
								</p>
								<p className="font-medium">{report.accountingUnit}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Gesamtbetrag</p>
								<p className="font-bold text-lg">{totalAmount.toFixed(2)} €</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Anzahl Ausgaben</p>
								<p className="font-medium">{report.expenses.length}</p>
							</div>
						</div>
						{isAdmin && (
							<div className="pt-4 border-t">
								<p className="text-sm text-muted-foreground">Antragsteller</p>
								<p className="font-medium">
									{report.owner.name} ({report.owner.email})
								</p>
							</div>
						)}

						{(report.status === ReportStatus.DRAFT ||
							report.status === ReportStatus.NEEDS_REVISION) && (
							<div className="flex gap-2 mt-6">
								<Button
									onClick={() =>
										handleStatusChange(ReportStatus.PENDING_APPROVAL)
									}
									disabled={updateStatusMutation.isPending}
									className="flex-1"
								>
									<Check className="mr-2 h-4 w-4" />
									Zur Genehmigung einreichen
								</Button>
							</div>
						)}
						{report.status === ReportStatus.PENDING_APPROVAL && isAdmin && (
							<div className="flex gap-2 mt-6">
								<Button
									onClick={() => handleStatusChange(ReportStatus.ACCEPTED)}
									disabled={updateStatusMutation.isPending}
									className="flex-1"
								>
									<Check className="mr-2 h-4 w-4" />
									Akzeptieren
								</Button>
								<Button
									onClick={() => handleStatusChange(ReportStatus.REJECTED)}
									disabled={updateStatusMutation.isPending}
									variant="destructive"
									className="flex-1"
								>
									<X className="mr-2 h-4 w-4" />
									Ablehnen
								</Button>
								<Button
									onClick={() => handleStatusChange(ReportStatus.NEEDS_REVISION)}
									disabled={updateStatusMutation.isPending}
									variant="outline"
									className="flex-1"
								>
									<Edit className="mr-2 h-4 w-4" />
									Zur Überarbeitung
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-xl font-semibold">Ausgaben</h2>
				{(report.status === ReportStatus.DRAFT ||
					report.status === ReportStatus.NEEDS_REVISION) && (
					<Link href={`/reports/${reportId}/expenses/new`}>
						<Button size="sm">
							<Plus className="mr-2 h-4 w-4" />
							Ausgabe hinzufügen
						</Button>
					</Link>
				)}
			</div>

			{report.expenses.length > 0 ? (
				<div className="space-y-4">
					{report.expenses.map((expense) => (
						<Card key={expense.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<CardTitle className="text-lg">
										{expenseTypeLabels[expense.type]}
									</CardTitle>
									<Badge variant="outline">
										{Number(expense.amount).toFixed(2)} €
									</Badge>
								</div>
								{expense.description && (
									<CardDescription>{expense.description}</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{expense.type === ExpenseType.RECEIPT && (
										<>
											{expense.reason && (
												<div>
													<p className="text-sm text-muted-foreground">
														Grund:
													</p>
													<p className="font-medium">{expense.reason}</p>
												</div>
											)}
											{expense.receiptFileUrl && (
												<div>
													<p className="text-sm text-muted-foreground mb-2">
														Beleg:
													</p>
													<a
														href={expense.receiptFileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="text-primary hover:underline"
													>
														Beleg öffnen
													</a>
												</div>
											)}
										</>
									)}
									{expense.type === ExpenseType.TRAVEL && (
										<>
											{expense.departure && expense.destination && (
												<div>
													<p className="text-sm text-muted-foreground">
														Route:
													</p>
													<p className="font-medium">
														{expense.departure} → {expense.destination}
													</p>
												</div>
											)}
											{expense.kilometers && (
												<div>
													<p className="text-sm text-muted-foreground">
														Kilometer:
													</p>
													<p className="font-medium">
														{Number(expense.kilometers).toFixed(2)} km
													</p>
												</div>
											)}
											{expense.travelReason && (
												<div>
													<p className="text-sm text-muted-foreground">
														Grund:
													</p>
													<p className="font-medium">
														{expense.travelReason}
													</p>
												</div>
											)}
										</>
									)}
									<div className="flex justify-between text-sm pt-2 border-t">
										<span className="text-muted-foreground">Datum:</span>
										<span>
											{new Date(expense.startDate).toLocaleDateString(
												"de-DE",
											)}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="pt-6 text-center">
						<p className="text-muted-foreground mb-4">
							Noch keine Ausgaben vorhanden.
						</p>
						{(report.status === ReportStatus.DRAFT ||
							report.status === ReportStatus.NEEDS_REVISION) && (
							<Link href={`/reports/${reportId}/expenses/new`}>
								<Button>
									<Plus className="mr-2 h-4 w-4" />
									Erste Ausgabe hinzufügen
								</Button>
							</Link>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

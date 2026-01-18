"use client";

import { ArrowLeft, Check, Edit, Plus, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
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
import { ExpenseType, ReportStatus } from "@/lib/enums";
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

const expenseTypeLabels: Record<ExpenseType, string> = {
	RECEIPT: "Beleg",
	TRAVEL: "Reise",
	FOOD: "Verpflegung",
};

export default function ReportDetailPage() {
	const params = useParams();
	const reportId = params.id as string;

	const { data: currentUser } = api.user.getCurrent.useQuery();
	const isAdmin = currentUser?.admin === true;

	// Use admin endpoint if user is admin, otherwise use regular endpoint
	const {
		data: report,
		isLoading,
		refetch,
	} = api.admin.getReportById.useQuery(
		{ id: reportId },
		{ enabled: !!reportId && isAdmin },
	);
	const { refetch: refetchUser } = api.report.getById.useQuery(
		{ id: reportId },
		{ enabled: !!reportId && !isAdmin },
	);

	const updateStatusMutationAdmin = api.admin.updateReportStatus.useMutation({
		onSuccess: () => {
			toast.success("Status aktualisiert");
			refetch();
		},
		onError: (error) => {
			toast.error(error.message || "Fehler beim Aktualisieren des Status");
		},
	});
	const updateStatusMutationUser = api.report.updateStatus.useMutation({
		onSuccess: () => {
			toast.success("Status aktualisiert");
			refetchUser();
		},
		onError: (error) => {
			toast.error(error.message || "Fehler beim Aktualisieren des Status");
		},
	});
	const updateStatusMutation = isAdmin
		? updateStatusMutationAdmin
		: updateStatusMutationUser;

	const handleStatusChange = (status: ReportStatus) => {
		updateStatusMutation.mutate({ id: reportId, status });
	};

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="py-12 text-center">Lade...</div>
			</div>
		);
	}

	if (!report) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="py-12 text-center">Report nicht gefunden</div>
			</div>
		);
	}

	const totalAmount = report.expenses.reduce(
		(sum, expense) => sum + Number(expense.amount),
		0,
	);

	const backUrl = isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.USER_DASHBOARD;

	return (
		<div className="container mx-auto px-4 py-8">
			<Link href={backUrl}>
				<Button className="mb-6" variant="ghost">
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
							<Badge className="text-sm" variant={statusVariants[report.status]}>
								{statusLabels[report.status]}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
							<div>
								<p className="text-muted-foreground text-sm">IBAN</p>
								<p className="font-medium">{report.businessUnit}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-sm">Buchungskreis</p>
								<p className="font-medium">{report.accountingUnit}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-sm">Gesamtbetrag</p>
								<p className="font-bold text-lg">{totalAmount.toFixed(2)} €</p>
							</div>
							<div>
								<p className="text-muted-foreground text-sm">Anzahl Ausgaben</p>
								<p className="font-medium">{report.expenses.length}</p>
							</div>
						</div>
						{isAdmin && (
							<div className="border-t pt-4">
								<p className="text-muted-foreground text-sm">Antragsteller</p>
								<p className="font-medium">
									{report.owner.name} ({report.owner.email})
								</p>
							</div>
						)}

						{(report.status === ReportStatus.DRAFT ||
							report.status === ReportStatus.NEEDS_REVISION) && (
							<div className="mt-6 flex gap-2">
								<Button
									className="flex-1"
									disabled={updateStatusMutation.isPending}
									onClick={() => handleStatusChange(ReportStatus.PENDING_APPROVAL)}
								>
									<Check className="mr-2 h-4 w-4" />
									Zur Genehmigung einreichen
								</Button>
							</div>
						)}
						{report.status === ReportStatus.PENDING_APPROVAL && isAdmin && (
							<div className="mt-6 flex gap-2">
								<Button
									className="flex-1"
									disabled={updateStatusMutation.isPending}
									onClick={() => handleStatusChange(ReportStatus.ACCEPTED)}
								>
									<Check className="mr-2 h-4 w-4" />
									Akzeptieren
								</Button>
								<Button
									className="flex-1"
									disabled={updateStatusMutation.isPending}
									onClick={() => handleStatusChange(ReportStatus.REJECTED)}
									variant="destructive"
								>
									<X className="mr-2 h-4 w-4" />
									Ablehnen
								</Button>
								<Button
									className="flex-1"
									disabled={updateStatusMutation.isPending}
									onClick={() => handleStatusChange(ReportStatus.NEEDS_REVISION)}
									variant="outline"
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
				<h2 className="font-semibold text-xl">Ausgaben</h2>
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
									<Badge variant="outline">{Number(expense.amount).toFixed(2)} €</Badge>
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
													<p className="text-muted-foreground text-sm">Grund:</p>
													<p className="font-medium">{expense.reason}</p>
												</div>
											)}
											{expense.receiptFileUrl && (
												<div>
													<p className="mb-2 text-muted-foreground text-sm">Beleg:</p>
													<a
														className="text-primary hover:underline"
														href={expense.receiptFileUrl}
														rel="noopener noreferrer"
														target="_blank"
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
													<p className="text-muted-foreground text-sm">Route:</p>
													<p className="font-medium">
														{expense.departure} → {expense.destination}
													</p>
												</div>
											)}
											{expense.kilometers && (
												<div>
													<p className="text-muted-foreground text-sm">Kilometer:</p>
													<p className="font-medium">
														{Number(expense.kilometers).toFixed(2)} km
													</p>
												</div>
											)}
											{expense.travelReason && (
												<div>
													<p className="text-muted-foreground text-sm">Grund:</p>
													<p className="font-medium">{expense.travelReason}</p>
												</div>
											)}
										</>
									)}
									<div className="flex justify-between border-t pt-2 text-sm">
										<span className="text-muted-foreground">Datum:</span>
										<span>{new Date(expense.startDate).toLocaleDateString("de-DE")}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="pt-6 text-center">
						<p className="mb-4 text-muted-foreground">
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

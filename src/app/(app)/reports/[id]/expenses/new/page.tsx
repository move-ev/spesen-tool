"use client";

import { useForm } from "@tanstack/react-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExpenseType } from "@/lib/enums";
import { api } from "@/trpc/react";

const expenseTypeOptions = [
	{ value: ExpenseType.RECEIPT, label: "Beleg" },
	{ value: ExpenseType.TRAVEL, label: "Reise" },
	{ value: ExpenseType.FOOD, label: "Verpflegung" },
];

export default function NewExpensePage() {
	const params = useParams();
	const router = useRouter();
	const reportId = params.id as string;
	const [expenseType, setExpenseType] = useState<ExpenseType>(
		ExpenseType.RECEIPT,
	);
	const getFieldError = (errors?: unknown[]) => {
		if (!errors?.length) return null;
		const firstError = errors[0];
		if (typeof firstError === "string") return firstError;
		if (
			typeof firstError === "object" &&
			firstError !== null &&
			"message" in firstError &&
			typeof (firstError as { message?: unknown }).message === "string"
		) {
			return (firstError as { message?: string }).message;
		}
		return "Ungültige Eingabe";
	};

	const { data: report } = api.report.getById.useQuery(
		{ id: reportId },
		{ enabled: !!reportId },
	);

	const createReceiptMutation = api.expense.createReceipt.useMutation({
		onSuccess: () => {
			toast.success("Beleg-Ausgabe erstellt");
			router.push(`/reports/${reportId}`);
		},
		onError: (error) => {
			toast.error(error.message || "Fehler beim Erstellen der Ausgabe");
		},
	});

	const createTravelMutation = api.expense.createTravel.useMutation({
		onSuccess: () => {
			toast.success("Reise-Ausgabe erstellt");
			router.push(`/reports/${reportId}`);
		},
		onError: (error) => {
			toast.error(error.message || "Fehler beim Erstellen der Ausgabe");
		},
	});

	const createFoodMutation = api.expense.createFood.useMutation({
		onSuccess: () => {
			toast.success("Verpflegungs-Ausgabe erstellt");
			router.push(`/reports/${reportId}`);
		},
		onError: (error) => {
			toast.error(error.message || "Fehler beim Erstellen der Ausgabe");
		},
	});

	const [uploadingFile, setUploadingFile] = useState(false);

	const uploadFile = async (file: File): Promise<string | null> => {
		try {
			setUploadingFile(true);
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Upload fehlgeschlagen");
			}

			const data = await response.json();
			return data.url;
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(
				error instanceof Error ? error.message : "Fehler beim Hochladen der Datei",
			);
			return null;
		} finally {
			setUploadingFile(false);
		}
	};

	const receiptForm = useForm({
		defaultValues: {
			description: "",
			amount: "",
			startDate: new Date().toISOString().split("T")[0],
			endDate: new Date().toISOString().split("T")[0],
			reason: "",
			receiptFile: null as File | null,
		},
		validators: {
			onSubmit: z.object({
				description: z.string(),
				amount: z
					.string()
					.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
						message: "Betrag muss eine positive Zahl sein",
					}),
				reason: z.string().min(1, "Grund ist erforderlich"),
				startDate: z.union([z.string().min(1), z.undefined()]),
				endDate: z.union([z.string().min(1), z.undefined()]),
				receiptFile: z.union([z.instanceof(File), z.null()]),
			}),
		},
		onSubmit: async ({ value }) => {
			let receiptFileUrl: string | undefined;

			// Upload file if provided
			if (value.receiptFile) {
				const url = await uploadFile(value.receiptFile);
				if (!url) {
					return; // Error already shown in uploadFile
				}
				receiptFileUrl = url;
			}

			createReceiptMutation.mutate({
				reportId,
				description: value.description || undefined,
				amount: Number(value.amount),
				startDate: new Date(value.startDate ?? Date.now()),
				endDate: new Date(value.endDate ?? Date.now()),
				reason: value.reason,
				receiptFileUrl,
			});
		},
	});

	const travelForm = useForm({
		defaultValues: {
			description: "",
			kilometers: "",
			departure: "",
			destination: "",
			travelReason: "",
			startDate: new Date().toISOString().split("T")[0],
			endDate: new Date().toISOString().split("T")[0],
		},
		validators: {
			onSubmit: z.object({
				description: z.string(),
				kilometers: z
					.string()
					.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
						message: "Kilometeranzahl muss eine positive Zahl sein",
					}),
				departure: z.string().min(1, "Abfahrtsort ist erforderlich"),
				destination: z.string().min(1, "Zielort ist erforderlich"),
				travelReason: z.string().min(1, "Grund ist erforderlich"),
				startDate: z.union([z.string().min(1), z.undefined()]),
				endDate: z.union([z.string().min(1), z.undefined()]),
			}),
		},
		onSubmit: async ({ value }) => {
			createTravelMutation.mutate({
				reportId,
				description: value.description || undefined,
				kilometers: Number(value.kilometers),
				departure: value.departure,
				destination: value.destination,
				travelReason: value.travelReason,
				startDate: new Date(value.startDate ?? Date.now()),
				endDate: new Date(value.endDate ?? Date.now()),
			});
		},
	});

	const foodForm = useForm({
		defaultValues: {
			description: "",
			amount: "",
			startDate: new Date().toISOString().split("T")[0],
			endDate: new Date().toISOString().split("T")[0],
		},
		validators: {
			onSubmit: z.object({
				description: z.string(),
				amount: z
					.string()
					.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
						message: "Betrag muss eine positive Zahl sein",
					}),
				startDate: z.union([z.string().min(1), z.undefined()]),
				endDate: z.union([z.string().min(1), z.undefined()]),
			}),
		},
		onSubmit: async ({ value }) => {
			createFoodMutation.mutate({
				reportId,
				description: value.description || undefined,
				amount: Number(value.amount),
				startDate: new Date(value.startDate ?? Date.now()),
				endDate: new Date(value.endDate ?? Date.now()),
			});
		},
	});

	const getCurrentForm = () => {
		switch (expenseType) {
			case ExpenseType.RECEIPT:
				return receiptForm;
			case ExpenseType.TRAVEL:
				return travelForm;
			case ExpenseType.FOOD:
				return foodForm;
		}
	};

	const handleSubmit = () => {
		const form = getCurrentForm();
		form.handleSubmit();
	};

	const isPending =
		createReceiptMutation.isPending ||
		createTravelMutation.isPending ||
		createFoodMutation.isPending ||
		uploadingFile;

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<Link href={`/reports/${reportId}`}>
				<Button className="mb-6" variant="ghost">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Zurück zum Report
				</Button>
			</Link>

			<Card>
				<CardHeader>
					<CardTitle>Neue Ausgabe</CardTitle>
					<CardDescription>
						Füge eine neue Ausgabe zu "{report?.title}" hinzu
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-6">
						<Label>Ausgabentyp</Label>
						<div className="mt-2 flex gap-2">
							{expenseTypeOptions.map((option) => (
								<Button
									className="flex-1"
									key={option.value}
									onClick={() => setExpenseType(option.value)}
									type="button"
									variant={expenseType === option.value ? "default" : "outline"}
								>
									{option.label}
								</Button>
							))}
						</div>
					</div>

					{expenseType === ExpenseType.RECEIPT && (
						<form
							className="space-y-4"
							onSubmit={(e) => {
								e.preventDefault();
								receiptForm.handleSubmit();
							}}
						>
							<receiptForm.Field name="description">
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Beschreibung</Label>
										<Input
											id={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Optionale Beschreibung"
											value={field.state.value}
										/>
									</div>
								)}
							</receiptForm.Field>

							<receiptForm.Field
								name="amount"
								validators={{
									onChange: z
										.string()
										.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
											message: "Betrag muss eine positive Zahl sein",
										}),
								}}
							>
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Betrag (€) *</Label>
										<Input
											id={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="0.00"
											step="0.01"
											type="number"
											value={field.state.value}
										/>
										{field.state.meta.errors && (
											<p className="mt-1 text-destructive text-sm">
												{getFieldError(field.state.meta.errors)}
											</p>
										)}
									</div>
								)}
							</receiptForm.Field>

							<receiptForm.Field
								name="reason"
								validators={{
									onChange: z.string().min(1, "Grund ist erforderlich"),
								}}
							>
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Grund für den Verein *</Label>
										<Input
											id={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Warum war diese Ausgabe notwendig?"
											value={field.state.value}
										/>
										{field.state.meta.errors && (
											<p className="mt-1 text-destructive text-sm">
												{getFieldError(field.state.meta.errors)}
											</p>
										)}
									</div>
								)}
							</receiptForm.Field>

							<receiptForm.Field name="receiptFile">
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Beleg (PDF/Bild)</Label>
										<Input
											accept="image/*,application/pdf"
											disabled={uploadingFile}
											id={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => {
												const file = e.target.files?.[0] || null;
												field.handleChange(file);
											}}
											type="file"
										/>
										{field.state.value && (
											<p className="mt-1 text-muted-foreground text-sm">
												Ausgewählte Datei: {field.state.value.name}
											</p>
										)}
										{uploadingFile && (
											<p className="mt-1 text-muted-foreground text-sm">
												Lade Datei hoch...
											</p>
										)}
										<p className="mt-1 text-muted-foreground text-sm">
											Maximale Dateigröße: 10MB. Erlaubte Formate: JPG, PNG, WebP, PDF
										</p>
									</div>
								)}
							</receiptForm.Field>

							<div className="grid grid-cols-2 gap-4">
								<receiptForm.Field
									name="startDate"
									validators={{
										onChange: z.string().min(1),
									}}
								>
									{(field) => (
										<div>
											<Label htmlFor={field.name}>Datum *</Label>
											<Input
												id={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												type="date"
												value={field.state.value}
											/>
										</div>
									)}
								</receiptForm.Field>

								<receiptForm.Field
									name="endDate"
									validators={{
										onChange: z.string().min(1),
									}}
								>
									{(field) => (
										<div>
											<Label htmlFor={field.name}>Enddatum *</Label>
											<Input
												id={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												type="date"
												value={field.state.value}
											/>
										</div>
									)}
								</receiptForm.Field>
							</div>
						</form>
					)}

					{expenseType === ExpenseType.TRAVEL && (
						<form
							className="space-y-4"
							onSubmit={(e) => {
								e.preventDefault();
								travelForm.handleSubmit();
							}}
						>
							<travelForm.Field name="description">
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Beschreibung</Label>
										<Input
											id={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Optionale Beschreibung"
											value={field.state.value}
										/>
									</div>
								)}
							</travelForm.Field>

							<div className="grid grid-cols-2 gap-4">
								<travelForm.Field
									name="departure"
									validators={{
										onChange: z.string().min(1, "Abfahrtsort ist erforderlich"),
									}}
								>
									{(field) => (
										<div>
											<Label htmlFor={field.name}>Abfahrtsort *</Label>
											<Input
												id={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="z.B. Berlin"
												value={field.state.value}
											/>
											{field.state.meta.errors && (
												<p className="mt-1 text-destructive text-sm">
													{getFieldError(field.state.meta.errors)}
												</p>
											)}
										</div>
									)}
								</travelForm.Field>

								<travelForm.Field
									name="destination"
									validators={{
										onChange: z.string().min(1, "Zielort ist erforderlich"),
									}}
								>
									{(field) => (
										<div>
											<Label htmlFor={field.name}>Zielort *</Label>
											<Input
												id={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="z.B. München"
												value={field.state.value}
											/>
											{field.state.meta.errors && (
												<p className="mt-1 text-destructive text-sm">
													{getFieldError(field.state.meta.errors)}
												</p>
											)}
										</div>
									)}
								</travelForm.Field>
							</div>

							<travelForm.Field
								name="kilometers"
								validators={{
									onChange: z
										.string()
										.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
											message: "Kilometeranzahl muss eine positive Zahl sein",
										}),
								}}
							>
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Kilometer *</Label>
										<Input
											id={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="0.0"
											step="0.1"
											type="number"
											value={field.state.value}
										/>
										{field.state.meta.errors && (
											<p className="mt-1 text-destructive text-sm">
												{getFieldError(field.state.meta.errors)}
											</p>
										)}
									</div>
								)}
							</travelForm.Field>

							<travelForm.Field
								name="travelReason"
								validators={{
									onChange: z.string().min(1, "Grund ist erforderlich"),
								}}
							>
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Grund für die Reise *</Label>
										<Input
											id={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Warum war diese Reise notwendig?"
											value={field.state.value}
										/>
										{field.state.meta.errors && (
											<p className="mt-1 text-destructive text-sm">
												{getFieldError(field.state.meta.errors)}
											</p>
										)}
									</div>
								)}
							</travelForm.Field>

							<div className="grid grid-cols-2 gap-4">
								<travelForm.Field
									name="startDate"
									validators={{
										onChange: z.string().min(1),
									}}
								>
									{(field) => (
										<div>
											<Label htmlFor={field.name}>Datum *</Label>
											<Input
												id={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												type="date"
												value={field.state.value}
											/>
										</div>
									)}
								</travelForm.Field>

								<travelForm.Field
									name="endDate"
									validators={{
										onChange: z.string().min(1),
									}}
								>
									{(field) => (
										<div>
											<Label htmlFor={field.name}>Enddatum *</Label>
											<Input
												id={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												type="date"
												value={field.state.value}
											/>
										</div>
									)}
								</travelForm.Field>
							</div>
						</form>
					)}

					{expenseType === ExpenseType.FOOD && (
						<form
							className="space-y-4"
							onSubmit={(e) => {
								e.preventDefault();
								foodForm.handleSubmit();
							}}
						>
							<foodForm.Field name="description">
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Beschreibung</Label>
										<Input
											id={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Optionale Beschreibung"
											value={field.state.value}
										/>
									</div>
								)}
							</foodForm.Field>

							<foodForm.Field
								name="amount"
								validators={{
									onChange: z
										.string()
										.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
											message: "Betrag muss eine positive Zahl sein",
										}),
								}}
							>
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Betrag (€) *</Label>
										<Input
											id={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="0.00"
											step="0.01"
											type="number"
											value={field.state.value}
										/>
										{field.state.meta.errors && (
											<p className="mt-1 text-destructive text-sm">
												{getFieldError(field.state.meta.errors)}
											</p>
										)}
									</div>
								)}
							</foodForm.Field>

							<div className="grid grid-cols-2 gap-4">
								<foodForm.Field
									name="startDate"
									validators={{
										onChange: z.string().min(1),
									}}
								>
									{(field) => (
										<div>
											<Label htmlFor={field.name}>Datum *</Label>
											<Input
												id={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												type="date"
												value={field.state.value}
											/>
										</div>
									)}
								</foodForm.Field>

								<foodForm.Field
									name="endDate"
									validators={{
										onChange: z.string().min(1),
									}}
								>
									{(field) => (
										<div>
											<Label htmlFor={field.name}>Enddatum *</Label>
											<Input
												id={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												type="date"
												value={field.state.value}
											/>
										</div>
									)}
								</foodForm.Field>
							</div>
						</form>
					)}

					<div className="flex gap-2 pt-4">
						<Button
							className="flex-1"
							onClick={() => router.back()}
							type="button"
							variant="outline"
						>
							Abbrechen
						</Button>
						<Button
							className="flex-1"
							disabled={isPending}
							onClick={handleSubmit}
							type="button"
						>
							{isPending ? "Erstelle..." : "Erstellen"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

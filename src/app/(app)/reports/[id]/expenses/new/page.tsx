"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ExpenseType } from "@/lib/enums";

const expenseTypeOptions = [
	{ value: ExpenseType.RECEIPT, label: "Beleg" },
	{ value: ExpenseType.TRAVEL, label: "Reise" },
	{ value: ExpenseType.FOOD, label: "Verpflegung" },
];

export default function NewExpensePage() {
	const params = useParams();
	const router = useRouter();
	const reportId = params.id as string;
	const [expenseType, setExpenseType] = useState<ExpenseType>(ExpenseType.RECEIPT);
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
				error instanceof Error
					? error.message
					: "Fehler beim Hochladen der Datei",
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
				amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
					message: "Betrag muss eine positive Zahl sein",
				}),
				reason: z.string().min(1, "Grund ist erforderlich"),
				startDate: z.union([z.string().min(1), z.undefined()]),
				endDate: z.union([z.string().min(1), z.undefined()]),
				receiptFile: z.union([z.instanceof(File), z.null()]),
			}),
		},
		onSubmit: async ({ value }) => {
			let receiptFileUrl: string | undefined = undefined;

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
				kilometers: z.string().refine(
					(val) => !isNaN(Number(val)) && Number(val) > 0,
					{ message: "Kilometeranzahl muss eine positive Zahl sein" },
				),
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
				amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
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
		<div className="container mx-auto py-8 px-4 max-w-2xl">
			<Link href={`/reports/${reportId}`}>
				<Button variant="ghost" className="mb-6">
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
						<div className="flex gap-2 mt-2">
							{expenseTypeOptions.map((option) => (
								<Button
									key={option.value}
									type="button"
									variant={
										expenseType === option.value ? "default" : "outline"
									}
									onClick={() => setExpenseType(option.value)}
									className="flex-1"
								>
									{option.label}
								</Button>
							))}
						</div>
					</div>

					{expenseType === ExpenseType.RECEIPT && (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								receiptForm.handleSubmit();
							}}
							className="space-y-4"
						>
							<receiptForm.Field name="description">
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Beschreibung</Label>
										<Input
											id={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="Optionale Beschreibung"
										/>
									</div>
								)}
							</receiptForm.Field>

							<receiptForm.Field
								name="amount"
								validators={{
									onChange: z
										.string()
										.refine(
											(val) => !isNaN(Number(val)) && Number(val) > 0,
											{ message: "Betrag muss eine positive Zahl sein" },
										),
								}}
							>
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Betrag (€) *</Label>
										<Input
											id={field.name}
											type="number"
											step="0.01"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="0.00"
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-destructive mt-1">
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
										<Label htmlFor={field.name}>
											Grund für den Verein *
										</Label>
										<Input
											id={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="Warum war diese Ausgabe notwendig?"
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-destructive mt-1">
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
											id={field.name}
											type="file"
											accept="image/*,application/pdf"
											onChange={(e) => {
												const file = e.target.files?.[0] || null;
												field.handleChange(file);
											}}
											onBlur={field.handleBlur}
											disabled={uploadingFile}
										/>
										{field.state.value && (
											<p className="text-sm text-muted-foreground mt-1">
												Ausgewählte Datei: {field.state.value.name}
											</p>
										)}
										{uploadingFile && (
											<p className="text-sm text-muted-foreground mt-1">
												Lade Datei hoch...
											</p>
										)}
										<p className="text-sm text-muted-foreground mt-1">
											Maximale Dateigröße: 10MB. Erlaubte Formate: JPG, PNG,
											WebP, PDF
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
												type="date"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
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
												type="date"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
											/>
										</div>
									)}
								</receiptForm.Field>
							</div>
						</form>
					)}

					{expenseType === ExpenseType.TRAVEL && (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								travelForm.handleSubmit();
							}}
							className="space-y-4"
						>
							<travelForm.Field name="description">
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Beschreibung</Label>
										<Input
											id={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="Optionale Beschreibung"
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
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												placeholder="z.B. Berlin"
											/>
											{field.state.meta.errors && (
												<p className="text-sm text-destructive mt-1">
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
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												placeholder="z.B. München"
											/>
											{field.state.meta.errors && (
												<p className="text-sm text-destructive mt-1">
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
										.refine(
											(val) => !isNaN(Number(val)) && Number(val) > 0,
											{ message: "Kilometeranzahl muss eine positive Zahl sein" },
										),
								}}
							>
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Kilometer *</Label>
										<Input
											id={field.name}
											type="number"
											step="0.1"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="0.0"
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-destructive mt-1">
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
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="Warum war diese Reise notwendig?"
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-destructive mt-1">
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
												type="date"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
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
												type="date"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
											/>
										</div>
									)}
								</travelForm.Field>
							</div>
						</form>
					)}

					{expenseType === ExpenseType.FOOD && (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								foodForm.handleSubmit();
							}}
							className="space-y-4"
						>
							<foodForm.Field name="description">
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Beschreibung</Label>
										<Input
											id={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="Optionale Beschreibung"
										/>
									</div>
								)}
							</foodForm.Field>

							<foodForm.Field
								name="amount"
								validators={{
									onChange: z
										.string()
										.refine(
											(val) => !isNaN(Number(val)) && Number(val) > 0,
											{ message: "Betrag muss eine positive Zahl sein" },
										),
								}}
							>
								{(field) => (
									<div>
										<Label htmlFor={field.name}>Betrag (€) *</Label>
										<Input
											id={field.name}
											type="number"
											step="0.01"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="0.00"
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-destructive mt-1">
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
												type="date"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
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
												type="date"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
											/>
										</div>
									)}
								</foodForm.Field>
							</div>
						</form>
					)}

					<div className="flex gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							className="flex-1"
						>
							Abbrechen
						</Button>
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={isPending}
							className="flex-1"
						>
							{isPending ? "Erstelle..." : "Erstellen"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

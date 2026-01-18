"use client";

import { useForm } from "@tanstack/react-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ExpenseType } from "@/lib/enums";
import { createExpenseSchema } from "@/lib/validators";
import { api } from "@/trpc/react";

const expenseTypeOptions = [
	{ value: ExpenseType.RECEIPT, label: "Beleg" },
	{ value: ExpenseType.TRAVEL, label: "Reise" },
	{ value: ExpenseType.FOOD, label: "Verpflegung" },
];

type CreateExpenseFormProps = {
	reportId: string;
};

export function CreateExpenseForm({ reportId }: CreateExpenseFormProps) {
	const router = useRouter();
	const [expenseType, setExpenseType] = useState<ExpenseType>(
		ExpenseType.RECEIPT,
	);
	const [uploadingFile, setUploadingFile] = useState(false);
	const parseLocalDate = (date?: string) =>
		date ? new Date(`${date}T00:00:00`) : new Date();

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

	const form = useForm({
		defaultValues: {
			type: ExpenseType.RECEIPT as ExpenseType,
			description: "",
			amount: "",
			reason: "",
			receiptFile: null as File | null,
			kilometers: "",
			departure: "",
			destination: "",
			travelReason: "",
			startDate: new Date().toISOString().split("T")[0],
			endDate: new Date().toISOString().split("T")[0],
		},
		validators: {
			onSubmit: createExpenseSchema,
		},
		onSubmit: async ({ value }) => {
			if (value.type === ExpenseType.RECEIPT) {
				let receiptFileUrl: string | undefined;

				if (value.receiptFile) {
					const url = await uploadFile(value.receiptFile);
					if (!url) {
						return;
					}
					receiptFileUrl = url;
				}

				createReceiptMutation.mutate({
					reportId,
					description: value.description || undefined,
					amount: Number(value.amount),
					startDate: parseLocalDate(value.startDate),
					endDate: parseLocalDate(value.endDate),
					reason: value.reason,
					receiptFileUrl,
				});
				return;
			}

			if (value.type === ExpenseType.TRAVEL) {
				createTravelMutation.mutate({
					reportId,
					description: value.description || undefined,
					kilometers: Number(value.kilometers),
					departure: value.departure,
					destination: value.destination,
					travelReason: value.travelReason,
					startDate: parseLocalDate(value.startDate),
					endDate: parseLocalDate(value.endDate),
				});
				return;
			}

			createFoodMutation.mutate({
				reportId,
				description: value.description || undefined,
				amount: Number(value.amount),
				startDate: parseLocalDate(value.startDate),
				endDate: parseLocalDate(value.endDate),
			});
		},
	});

	const isPending =
		createReceiptMutation.isPending ||
		createTravelMutation.isPending ||
		createFoodMutation.isPending ||
		uploadingFile;

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<Button asChild className="mb-6" variant="ghost">
				<Link href={`/reports/${reportId}`}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Zurück zum Report
				</Link>
			</Button>

			<Card>
				<CardHeader>
					<CardTitle>Neue Ausgabe</CardTitle>
					<CardDescription>
						Füge eine neue Ausgabe zu "{report?.title}" hinzu
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<FieldGroup className="gap-4">
							<Field>
								<FieldLabel>Ausgabentyp</FieldLabel>
								<div className="mt-2 flex gap-2">
									{expenseTypeOptions.map((option) => (
										<Button
											className="flex-1"
											key={option.value}
											onClick={() => {
												setExpenseType(option.value);
												form.setFieldValue("type", option.value);
											}}
											type="button"
											variant={expenseType === option.value ? "default" : "outline"}
										>
											{option.label}
										</Button>
									))}
								</div>
							</Field>

							{expenseType === ExpenseType.RECEIPT && (
								<>
									<form.Field name="description">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Beschreibung</FieldLabel>
													<Input
														aria-invalid={isInvalid}
														id={field.name}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Optionale Beschreibung"
														value={field.state.value}
													/>
													{isInvalid && <FieldError errors={field.state.meta.errors} />}
												</Field>
											);
										}}
									</form.Field>

									<form.Field
										name="amount"
										validators={{
											onChange: z
												.string()
												.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
													message: "Betrag muss eine positive Zahl sein",
												}),
										}}
									>
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Betrag (€) *</FieldLabel>
													<Input
														aria-invalid={isInvalid}
														id={field.name}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="0.00"
														step="0.01"
														type="number"
														value={field.state.value}
													/>
													{isInvalid && <FieldError errors={field.state.meta.errors} />}
												</Field>
											);
										}}
									</form.Field>

									<form.Field
										name="reason"
										validators={{
											onChange: z.string().min(1, "Grund ist erforderlich"),
										}}
									>
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>
														Grund für den Verein *
													</FieldLabel>
													<Input
														aria-invalid={isInvalid}
														id={field.name}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Warum war diese Ausgabe notwendig?"
														value={field.state.value}
													/>
													{isInvalid && <FieldError errors={field.state.meta.errors} />}
												</Field>
											);
										}}
									</form.Field>

									<form.Field name="receiptFile">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Beleg (PDF/Bild)</FieldLabel>
													<Input
														accept="image/*,application/pdf"
														aria-invalid={isInvalid}
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
													{isInvalid && <FieldError errors={field.state.meta.errors} />}
												</Field>
											);
										}}
									</form.Field>

									<div className="grid grid-cols-2 gap-4">
										<form.Field
											name="startDate"
											validators={{
												onChange: z.string().min(1),
											}}
										>
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>Datum *</FieldLabel>
														<Input
															aria-invalid={isInvalid}
															id={field.name}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															type="date"
															value={field.state.value}
														/>
														{isInvalid && <FieldError errors={field.state.meta.errors} />}
													</Field>
												);
											}}
										</form.Field>

										<form.Field
											name="endDate"
											validators={{
												onChange: z.string().min(1),
											}}
										>
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>Enddatum *</FieldLabel>
														<Input
															aria-invalid={isInvalid}
															id={field.name}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															type="date"
															value={field.state.value}
														/>
														{isInvalid && <FieldError errors={field.state.meta.errors} />}
													</Field>
												);
											}}
										</form.Field>
									</div>
								</>
							)}

							{expenseType === ExpenseType.TRAVEL && (
								<>
									<form.Field name="description">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Beschreibung</FieldLabel>
													<Input
														aria-invalid={isInvalid}
														id={field.name}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Optionale Beschreibung"
														value={field.state.value}
													/>
													{isInvalid && <FieldError errors={field.state.meta.errors} />}
												</Field>
											);
										}}
									</form.Field>

									<div className="grid grid-cols-2 gap-4">
										<form.Field
											name="departure"
											validators={{
												onChange: z.string().min(1, "Abfahrtsort ist erforderlich"),
											}}
										>
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>Abfahrtsort *</FieldLabel>
														<Input
															aria-invalid={isInvalid}
															id={field.name}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															placeholder="z.B. Berlin"
															value={field.state.value}
														/>
														{isInvalid && <FieldError errors={field.state.meta.errors} />}
													</Field>
												);
											}}
										</form.Field>

										<form.Field
											name="destination"
											validators={{
												onChange: z.string().min(1, "Zielort ist erforderlich"),
											}}
										>
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>Zielort *</FieldLabel>
														<Input
															aria-invalid={isInvalid}
															id={field.name}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															placeholder="z.B. München"
															value={field.state.value}
														/>
														{isInvalid && <FieldError errors={field.state.meta.errors} />}
													</Field>
												);
											}}
										</form.Field>
									</div>

									<form.Field
										name="kilometers"
										validators={{
											onChange: z
												.string()
												.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
													message: "Kilometeranzahl muss eine positive Zahl sein",
												}),
										}}
									>
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Kilometer *</FieldLabel>
													<Input
														aria-invalid={isInvalid}
														id={field.name}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="0.0"
														step="0.1"
														type="number"
														value={field.state.value}
													/>
													{isInvalid && <FieldError errors={field.state.meta.errors} />}
												</Field>
											);
										}}
									</form.Field>

									<form.Field
										name="travelReason"
										validators={{
											onChange: z.string().min(1, "Grund ist erforderlich"),
										}}
									>
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Grund für die Reise *</FieldLabel>
													<Input
														aria-invalid={isInvalid}
														id={field.name}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Warum war diese Reise notwendig?"
														value={field.state.value}
													/>
													{isInvalid && <FieldError errors={field.state.meta.errors} />}
												</Field>
											);
										}}
									</form.Field>

									<div className="grid grid-cols-2 gap-4">
										<form.Field
											name="startDate"
											validators={{
												onChange: z.string().min(1),
											}}
										>
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>Datum *</FieldLabel>
														<Input
															aria-invalid={isInvalid}
															id={field.name}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															type="date"
															value={field.state.value}
														/>
														{isInvalid && <FieldError errors={field.state.meta.errors} />}
													</Field>
												);
											}}
										</form.Field>

										<form.Field
											name="endDate"
											validators={{
												onChange: z.string().min(1),
											}}
										>
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>Enddatum *</FieldLabel>
														<Input
															aria-invalid={isInvalid}
															id={field.name}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															type="date"
															value={field.state.value}
														/>
														{isInvalid && <FieldError errors={field.state.meta.errors} />}
													</Field>
												);
											}}
										</form.Field>
									</div>
								</>
							)}

							{expenseType === ExpenseType.FOOD && (
								<>
									<form.Field name="description">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Beschreibung</FieldLabel>
													<Input
														aria-invalid={isInvalid}
														id={field.name}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Optionale Beschreibung"
														value={field.state.value}
													/>
													{isInvalid && <FieldError errors={field.state.meta.errors} />}
												</Field>
											);
										}}
									</form.Field>

									<form.Field
										name="amount"
										validators={{
											onChange: z
												.string()
												.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
													message: "Betrag muss eine positive Zahl sein",
												}),
										}}
									>
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Betrag (€) *</FieldLabel>
													<Input
														aria-invalid={isInvalid}
														id={field.name}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="0.00"
														step="0.01"
														type="number"
														value={field.state.value}
													/>
													{isInvalid && <FieldError errors={field.state.meta.errors} />}
												</Field>
											);
										}}
									</form.Field>

									<div className="grid grid-cols-2 gap-4">
										<form.Field
											name="startDate"
											validators={{
												onChange: z.string().min(1),
											}}
										>
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>Datum *</FieldLabel>
														<Input
															aria-invalid={isInvalid}
															id={field.name}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															type="date"
															value={field.state.value}
														/>
														{isInvalid && <FieldError errors={field.state.meta.errors} />}
													</Field>
												);
											}}
										</form.Field>

										<form.Field
											name="endDate"
											validators={{
												onChange: z.string().min(1),
											}}
										>
											{(field) => {
												const isInvalid =
													field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>Enddatum *</FieldLabel>
														<Input
															aria-invalid={isInvalid}
															id={field.name}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															type="date"
															value={field.state.value}
														/>
														{isInvalid && <FieldError errors={field.state.meta.errors} />}
													</Field>
												);
											}}
										</form.Field>
									</div>
								</>
							)}

							<div className="flex gap-2 pt-2">
								<Button
									className="flex-1"
									onClick={() => router.back()}
									type="button"
									variant="outline"
								>
									Abbrechen
								</Button>
								<Button className="flex-1" disabled={isPending} type="submit">
									{isPending ? "Erstelle..." : "Erstellen"}
								</Button>
							</div>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

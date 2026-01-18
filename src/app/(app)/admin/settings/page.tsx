"use client";

import { useRouter } from "next/navigation";
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

const formSchema = z.object({
	kilometerRate: z.string().refine(
		(val) => !isNaN(Number(val)) && Number(val) > 0,
		{ message: "Kilometerpauschale muss eine positive Zahl sein" },
	),
	reviewerEmail: z.string().email().optional().or(z.literal("")),
	accountingUnitPdfUrl: z.string().optional().or(z.literal("")),
});

export default function AdminSettingsPage() {
	const router = useRouter();
	const [isUploading, setIsUploading] = useState(false);
	const { data: settings, isLoading } = api.settings.get.useQuery();

	const updateSettingsMutation = api.settings.update.useMutation({
		onSuccess: () => {
			toast.success("Einstellungen gespeichert");
			router.push("/");
		},
		onError: (error) => {
			toast.error(error.message || "Fehler beim Speichern der Einstellungen");
		},
	});

	const form = useForm({
		defaultValues: {
			kilometerRate: settings?.kilometerRate.toString() ?? "0.30",
			reviewerEmail: settings?.reviewerEmail ?? "",
			accountingUnitPdfUrl: settings?.accountingUnitPdfUrl ?? "",
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			updateSettingsMutation.mutate({
				kilometerRate: Number(value.kilometerRate),
				reviewerEmail: value.reviewerEmail || null,
				accountingUnitPdfUrl: value.accountingUnitPdfUrl || null,
			});
		},
	});

	// Update form when settings load
	if (settings && form.state.values.kilometerRate === "0.30") {
		form.setFieldValue("kilometerRate", settings.kilometerRate.toString());
		form.setFieldValue("reviewerEmail", settings.reviewerEmail ?? "");
		form.setFieldValue(
			"accountingUnitPdfUrl",
			settings.accountingUnitPdfUrl ?? "",
		);
	}

	const handlePdfUpload = async (file: File) => {
		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/upload/settings-pdf", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error?.error ?? "Upload fehlgeschlagen");
			}

			const data = (await response.json()) as { url?: string };
			if (!data.url) {
				throw new Error("Keine URL vom Upload erhalten");
			}

			form.setFieldValue("accountingUnitPdfUrl", data.url);
			toast.success("PDF hochgeladen");
		} catch (error) {
			console.error("PDF upload error:", error);
			toast.error("PDF Upload fehlgeschlagen");
		} finally {
			setIsUploading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="container mx-auto py-8 px-4">
				<div className="text-center py-12">Lade...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-2xl">
			<Link href="/">
				<Button variant="ghost" className="mb-6">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Zurück zur Übersicht
				</Button>
			</Link>

			<Card>
				<CardHeader>
					<CardTitle>Admin-Einstellungen</CardTitle>
					<CardDescription>
						Verwalte globale Einstellungen für das Spesen-Tool
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<form.Field
							name="kilometerRate"
							validators={{
								onChange: z
									.string()
									.refine(
										(val) => !isNaN(Number(val)) && Number(val) > 0,
										{
											message:
												"Kilometerpauschale muss eine positive Zahl sein",
										},
									),
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>
										Kilometerpauschale (€ pro km) *
									</Label>
									<Input
										id={field.name}
										type="number"
										step="0.01"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="0.30"
									/>
									<p className="text-sm text-muted-foreground mt-1">
										Dieser Betrag wird pro Kilometer für Reise-Ausgaben
										berechnet.
									</p>
									{field.state.meta.errors && (
										<p className="text-sm text-destructive mt-1">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field
							name="reviewerEmail"
							validators={{
								onChange: z
									.string()
									.email("Ungültige E-Mail-Adresse")
									.optional()
									.or(z.literal("")),
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>
										E-Mail des Bearbeiters
									</Label>
									<Input
										id={field.name}
										type="email"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="bearbeiter@move-ev.de"
									/>
									<p className="text-sm text-muted-foreground mt-1">
										Diese E-Mail-Adresse erhält eine Benachrichtigung, wenn ein
										Spesenantrag eingereicht wird.
									</p>
									{field.state.meta.errors && (
										<p className="text-sm text-destructive mt-1">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="accountingUnitPdfUrl">
							{(field) => (
								<div>
									<Label htmlFor={field.name}>
										Buchungskreis PDF
									</Label>
									{field.state.value && (
										<p className="text-sm text-muted-foreground mt-1">
											Gespeichert:{" "}
											<span className="font-medium">
												{field.state.value.split("/").pop()}
											</span>
										</p>
									)}
									<div className="flex items-center gap-3">
										<Input
											id={field.name}
											type="file"
											accept="application/pdf"
											disabled={isUploading}
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) {
													handlePdfUpload(file);
												}
											}}
										/>
										{field.state.value && (
											<a
												href={field.state.value}
												target="_blank"
												rel="noreferrer"
												className="text-sm text-primary underline"
											>
												PDF öffnen
											</a>
										)}
									</div>
									<p className="text-sm text-muted-foreground mt-1">
										Diese PDF wird beim Buchungskreis als Info verlinkt.
									</p>
								</div>
							)}
						</form.Field>

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
								type="submit"
								disabled={updateSettingsMutation.isPending}
								className="flex-1"
							>
								{updateSettingsMutation.isPending
									? "Speichere..."
									: "Speichern"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

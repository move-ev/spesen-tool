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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";

const formSchema = z.object({
	kilometerRate: z
		.string()
		.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
			message: "Kilometerpauschale muss eine positive Zahl sein",
		}),
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
			<div className="container mx-auto px-4 py-8">
				<div className="py-12 text-center">Lade...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<Link href="/">
				<Button className="mb-6" variant="ghost">
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
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.Field
							name="kilometerRate"
							validators={{
								onChange: z
									.string()
									.refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
										message: "Kilometerpauschale muss eine positive Zahl sein",
									}),
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>Kilometerpauschale (€ pro km) *</Label>
									<Input
										id={field.name}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="0.30"
										step="0.01"
										type="number"
										value={field.state.value}
									/>
									<p className="mt-1 text-muted-foreground text-sm">
										Dieser Betrag wird pro Kilometer für Reise-Ausgaben berechnet.
									</p>
									{field.state.meta.errors && (
										<p className="mt-1 text-destructive text-sm">
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
									<Label htmlFor={field.name}>E-Mail des Bearbeiters</Label>
									<Input
										id={field.name}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="bearbeiter@move-ev.de"
										type="email"
										value={field.state.value}
									/>
									<p className="mt-1 text-muted-foreground text-sm">
										Diese E-Mail-Adresse erhält eine Benachrichtigung, wenn ein
										Spesenantrag eingereicht wird.
									</p>
									{field.state.meta.errors && (
										<p className="mt-1 text-destructive text-sm">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="accountingUnitPdfUrl">
							{(field) => (
								<div>
									<Label htmlFor={field.name}>Buchungskreis PDF</Label>
									{field.state.value && (
										<p className="mt-1 text-muted-foreground text-sm">
											Gespeichert:{" "}
											<span className="font-medium">
												{field.state.value.split("/").pop()}
											</span>
										</p>
									)}
									<div className="flex items-center gap-3">
										<Input
											accept="application/pdf"
											disabled={isUploading}
											id={field.name}
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) {
													handlePdfUpload(file);
												}
											}}
											type="file"
										/>
										{field.state.value && (
											<a
												className="text-primary text-sm underline"
												href={field.state.value}
												rel="noreferrer"
												target="_blank"
											>
												PDF öffnen
											</a>
										)}
									</div>
									<p className="mt-1 text-muted-foreground text-sm">
										Diese PDF wird beim Buchungskreis als Info verlinkt.
									</p>
								</div>
							)}
						</form.Field>

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
								disabled={updateSettingsMutation.isPending}
								type="submit"
							>
								{updateSettingsMutation.isPending ? "Speichere..." : "Speichern"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

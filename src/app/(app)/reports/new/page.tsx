"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
	title: z.string().min(1, "Titel ist erforderlich"),
	description: z.string(),
	businessUnit: z.string().min(1, "IBAN ist erforderlich"),
	accountingUnit: z.string().min(1, "Buchungskreis ist erforderlich"),
});

export default function NewReportPage() {
	const router = useRouter();
	const { data: publicSettings } = api.settings.getPublic.useQuery();
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
	const createReportMutation = api.report.create.useMutation({
		onSuccess: (data) => {
			toast.success("Report erstellt");
			router.push(`/reports/${data.id}`);
		},
		onError: (error) => {
			toast.error(error.message || "Fehler beim Erstellen des Reports");
		},
	});

	const form = useForm({
		defaultValues: {
			title: "",
			description: "",
			businessUnit: "",
			accountingUnit: "",
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			createReportMutation.mutate({
				title: value.title,
				description: value.description || undefined,
				businessUnit: value.businessUnit,
				accountingUnit: value.accountingUnit,
			});
		},
	});

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
					<CardTitle>Neuer Spesenantrag</CardTitle>
					<CardDescription>
						Erstelle einen neuen Spesenantrag für deine Ausgaben
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
							name="title"
							validators={{
								onChange: z.string().min(1, "Titel ist erforderlich"),
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>Titel *</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="z.B. Q1 2025 Spesen"
									/>
									{field.state.meta.errors && (
										<p className="text-sm text-destructive mt-1">
											{getFieldError(field.state.meta.errors)}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="description">
							{(field) => (
								<div>
									<Label htmlFor={field.name}>Beschreibung</Label>
									<Input
										id={field.name}
										value={field.state.value ?? ""}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="Optionale Beschreibung"
									/>
								</div>
							)}
						</form.Field>

						<form.Field
							name="businessUnit"
							validators={{
								onChange: z.string().min(1, "IBAN ist erforderlich"),
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>IBAN *</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="DE89 3704 0044 0532 0130 00"
									/>
									{field.state.meta.errors && (
										<p className="text-sm text-destructive mt-1">
											{getFieldError(field.state.meta.errors)}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field
							name="accountingUnit"
							validators={{
								onChange: z.string().min(1, "Buchungskreis ist erforderlich"),
							}}
						>
							{(field) => (
								<div>
									<div className="flex items-center gap-2">
										<Label htmlFor={field.name}>Buchungskreis *</Label>
										{publicSettings?.accountingUnitPdfUrl ? (
											<a
												href={publicSettings.accountingUnitPdfUrl}
												target="_blank"
												rel="noreferrer"
												className="text-muted-foreground hover:text-foreground"
												aria-label="Info zum Buchungskreis (PDF)"
											>
												<Info className="h-4 w-4" />
											</a>
										) : (
											<span
												className="text-muted-foreground/50 cursor-not-allowed"
												aria-label="Kein PDF hinterlegt"
											>
												<Info className="h-4 w-4" />
											</span>
										)}
									</div>
									<Input
										id={field.name}
										className="mt-1"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="z.B. Kostenstelle 123"
									/>
									{field.state.meta.errors && (
										<p className="text-sm text-destructive mt-1">
											{getFieldError(field.state.meta.errors)}
										</p>
									)}
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
								disabled={createReportMutation.isPending}
								className="flex-1"
							>
								{createReportMutation.isPending ? "Erstelle..." : "Erstellen"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<Link href="/">
				<Button className="mb-6" variant="ghost">
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
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
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
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="z.B. Q1 2025 Spesen"
										value={field.state.value}
									/>
									{field.state.meta.errors && (
										<p className="mt-1 text-destructive text-sm">
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
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Optionale Beschreibung"
										value={field.state.value ?? ""}
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
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="DE89 3704 0044 0532 0130 00"
										value={field.state.value}
									/>
									{field.state.meta.errors && (
										<p className="mt-1 text-destructive text-sm">
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
												aria-label="Info zum Buchungskreis (PDF)"
												className="text-muted-foreground hover:text-foreground"
												href={publicSettings.accountingUnitPdfUrl}
												rel="noreferrer"
												target="_blank"
											>
												<Info className="h-4 w-4" />
											</a>
										) : (
											<span className="cursor-not-allowed text-muted-foreground/50">
												<Info className="h-4 w-4" />
											</span>
										)}
									</div>
									<Input
										className="mt-1"
										id={field.name}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="z.B. Kostenstelle 123"
										value={field.state.value}
									/>
									{field.state.meta.errors && (
										<p className="mt-1 text-destructive text-sm">
											{getFieldError(field.state.meta.errors)}
										</p>
									)}
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
								disabled={createReportMutation.isPending}
								type="submit"
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

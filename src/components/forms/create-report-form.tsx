"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/lib/consts";
import { createReportSchema } from "@/lib/validators";
import { api } from "@/trpc/react";
import { Button } from "../ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import {
	NativeSelect,
	NativeSelectOptGroup,
	NativeSelectOption,
} from "../ui/native-select";
import { Textarea } from "../ui/textarea";

export function CreateReportForm({ ...props }: React.ComponentProps<"form">) {
	const [costUnits] = api.costUnit.listGrouped.useSuspenseQuery();

	const router = useRouter();

	const createReport = api.report.create.useMutation({
		onSuccess(data) {
			toast.success("Report erfolgreich erstellt");
			router.push(ROUTES.REPORT_DETAIL(data.id));
		},
		onError(error) {
			toast.error("Fehler beim Erstellen des Reports", {
				description: error.message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	const form = useForm({
		defaultValues: {
			title: "",
			description: "",
			costUnitId: "",
		},
		validators: {
			onSubmit: createReportSchema,
		},
		onSubmit: (value) => {
			createReport.mutate({
				...value.value,
			});
		},
	});

	return (
		<form
			id="form-create-report"
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			<FieldGroup className="grid gap-4">
				<form.Field
					children={(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Titel</FieldLabel>
								<Input
									aria-invalid={isInvalid}
									autoComplete="off"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Verpflegung Weihnachtsfeier"
									value={field.state.value}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="title"
				/>
				<form.Field
					children={(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Beschreibung</FieldLabel>
								<Textarea
									aria-invalid={isInvalid}
									autoComplete="off"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Beschreibung des Reports"
									value={field.state.value}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="description"
				/>

				<form.Field
					children={(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Kostenstelle</FieldLabel>
								<NativeSelect
									onChange={(e) => field.handleChange(e.target.value)}
									value={field.state.value}
								>
									<NativeSelectOption value="">
										Kostenstelle auswählen
									</NativeSelectOption>
									{costUnits.ungrouped.map((costUnit) => (
										<NativeSelectOption key={costUnit.id} value={costUnit.id}>
											{costUnit.title}
										</NativeSelectOption>
									))}
									{costUnits.grouped.map((group) => (
										<NativeSelectOptGroup
											key={group.group?.id}
											label={group.group?.title ?? "Unbekannte Gruppe"}
										>
											{group.costUnits.map((costUnit) => (
												<NativeSelectOption key={costUnit.id} value={costUnit.id}>
													{costUnit.title}
												</NativeSelectOption>
											))}
										</NativeSelectOptGroup>
									))}
								</NativeSelect>

								{(() => {
									const selectedUngrouped = costUnits.ungrouped.find(
										(u) => u.id === field.state.value,
									);
									const selectedGrouped = (() => {
										for (const group of costUnits.grouped) {
											const match = group.costUnits.find(
												(cu) => cu.id === field.state.value,
											);
											if (match) return match;
										}
										return undefined;
									})();
									const selectedCostUnit = selectedUngrouped || selectedGrouped;

									if (
										selectedCostUnit?.examples &&
										selectedCostUnit.examples.length > 0
									) {
										return (
											<div className="mt-1 rounded-lg border bg-muted/40 p-4 text-muted-foreground text-sm">
												<p className="mb-2">
													Zu der ausgewählten Kostenstelle gehören die folgenden Anliegen:
												</p>
												<ul className="list-inside list-disc">
													{selectedCostUnit.examples.map((example) => (
														<li key={example}>{example}</li>
													))}
												</ul>
											</div>
										);
									}
									return null;
								})()}
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="costUnitId"
				/>
				<Button
					disabled={createReport.isPending}
					form="form-create-report"
					type="submit"
				>
					Erstellen
				</Button>
			</FieldGroup>
		</form>
	);
}

"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/lib/consts";
import { createReportSchema } from "@/lib/validators";
import { api } from "@/trpc/react";
import { Button } from "../ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "../ui/field";
import { Input } from "../ui/input";
import {
	NativeSelect,
	NativeSelectOptGroup,
	NativeSelectOption,
} from "../ui/native-select";
import { Textarea } from "../ui/textarea";

export function CreateReportForm({ ...props }: React.ComponentProps<"form">) {
	const [costUnits] = api.costUnit.listGrouped.useSuspenseQuery();
	const [bankingDetails] = api.bankingDetails.list.useSuspenseQuery();

	// Create a Map for O(1) cost unit lookups by ID
	const costUnitMap = useMemo(() => {
		const map = new Map<
			string,
			{ id: string; tag: string; title: string; examples: string[] }
		>();
		for (const costUnit of costUnits.ungrouped) {
			map.set(costUnit.id, costUnit);
		}
		for (const group of costUnits.grouped) {
			for (const costUnit of group.costUnits) {
				map.set(costUnit.id, costUnit);
			}
		}
		return map;
	}, [costUnits]);

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
			bankingDetailsId: "",
		},
		validators: {
			onSubmit: createReportSchema,
		},
		onSubmit: async ({ value }) => {
			createReport.mutate({
				...value,
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
								<FieldLabel htmlFor={field.name}>Bankverbindung</FieldLabel>
								<NativeSelect
									onChange={(e) => field.handleChange(e.target.value)}
									value={field.state.value}
								>
									<NativeSelectOption value="">
										Bankverbindung auswählen
									</NativeSelectOption>
									{bankingDetails.map((bankingDetail) => (
										<NativeSelectOption key={bankingDetail.id} value={bankingDetail.id}>
											{bankingDetail.title}
										</NativeSelectOption>
									))}
								</NativeSelect>
								<FieldDescription>
									Wähle die Bankverbindung aus, die für diesen Report verwendet werden
									soll.
								</FieldDescription>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="bankingDetailsId"
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
									const selectedCostUnit = costUnitMap.get(field.state.value);

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

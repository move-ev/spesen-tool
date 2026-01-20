"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/lib/consts";
import { createReportSchema } from "@/lib/validators";
import { api } from "@/trpc/react";
import { Button } from "../ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "../ui/combobox";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export function CreateReportForm({
	businessUnits,
	...props
}: React.ComponentProps<"form"> & {
	businessUnits: { label: string; value: string }[];
}) {
	const [accountingUnits] = api.accountingUnit.listAll.useSuspenseQuery();
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
			businessUnit: "",
			accountingUnitId: "",
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
								<FieldLabel htmlFor={field.name}>Geschäftseinheit</FieldLabel>
								<Combobox
									items={businessUnits}
									onValueChange={(v) => {
										field.handleChange(v ? v.value : "");
									}}
									value={
										businessUnits.find((u) => u.value === field.state.value) ?? null
									}
								>
									<ComboboxInput
										aria-invalid={isInvalid}
										data-invalid={isInvalid}
										id={field.name}
										name={field.name}
										placeholder="Wähle eine Geschäftseinheit"
									/>
									<ComboboxContent>
										<ComboboxEmpty>Keine Geschäftseinheiten gefunden.</ComboboxEmpty>
										<ComboboxList>
											{(item) => (
												<ComboboxItem key={item.value} value={item}>
													{item.label}
												</ComboboxItem>
											)}
										</ComboboxList>
									</ComboboxContent>
								</Combobox>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="businessUnit"
				/>{" "}
				<form.Field
					children={(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Rechnungseinheit</FieldLabel>
								<Combobox
									items={accountingUnits}
									itemToStringLabel={(item) => item.name}
									itemToStringValue={(item) => item.id}
									onValueChange={(v) => {
										field.handleChange(v ? v.id : "");
									}}
									value={accountingUnits.find((u) => u.id === field.state.value) ?? null}
								>
									<ComboboxInput
										aria-invalid={isInvalid}
										data-invalid={isInvalid}
										id={field.name}
										name={field.name}
										placeholder="Wähle eine Rechnungseinheit"
									/>
									<ComboboxContent>
										<ComboboxEmpty>Keine Rechnungseinheiten gefunden.</ComboboxEmpty>
										<ComboboxList>
											{(item) => (
												<ComboboxItem key={item.id} value={item}>
													{item.name}
												</ComboboxItem>
											)}
										</ComboboxList>
									</ComboboxContent>
								</Combobox>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="accountingUnitId"
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

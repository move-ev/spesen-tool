"use client";

import { NumberField } from "@base-ui/react";
import { useForm } from "@tanstack/react-form";
import { formatDate } from "date-fns";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createReceiptExpenseSchema } from "@/lib/validators";
import { api } from "@/trpc/react";

export function CreateReceiptExpenseForm({
	reportId,
	onSuccess,
	...props
}: React.ComponentProps<"form"> & {
	reportId: string;
	onSuccess?: () => void;
}) {
	const utils = api.useUtils();
	const createReceipt = api.expense.createReceipt.useMutation({
		onSuccess: () => {
			utils.expense.invalidate();
			toast.success("Beleg-Ausgabe erfolgreich erstellt");
			onSuccess?.();
		},
		onError: (error) => {
			toast.error("Fehler beim Erstellen der Beleg-Ausgabe", {
				description: error.message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	const form = useForm({
		defaultValues: {
			description: "",
			amount: 0,
			startDate: formatDate(new Date(), "dd.MM.yyyy"),
			endDate: formatDate(new Date(), "dd.MM.yyyy"),
			type: "RECEIPT",
			reportId,
			receiptFileUrl: "",
		},
		validators: {
			onSubmit: createReceiptExpenseSchema,
		},
		onSubmit: ({ value }) => {
			createReceipt.mutate({
				amount: value.amount,
				description: value.description,
				startDate: value.startDate,
				endDate: value.endDate,
				type: "RECEIPT",
				reportId,
				receiptFileUrl: value.receiptFileUrl,
			});
		},
	});

	return (
		<form
			className="grid gap-4"
			id="form-create-receipt-expense"
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			<FieldGroup className="grid gap-4 md:grid-cols-2">
				<form.Field
					children={(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field className="md:col-span-2" data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Beschreibung</FieldLabel>
								<Textarea
									aria-invalid={isInvalid}
									autoComplete="off"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Verpflegung Weihnachtsfeier"
									value={field.state.value}
								/>
								<FieldDescription>
									Beschreibung der Ausgabe oder Kommentar
								</FieldDescription>
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
								<FieldLabel htmlFor={field.name}>Startdatum</FieldLabel>
								<DatePicker
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(date) => field.handleChange(date.target.value)}
									placeholder="01.01.2026"
									value={field.state.value}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="startDate"
				/>
				<form.Field
					children={(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Enddatum</FieldLabel>
								<DatePicker
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(date) => field.handleChange(date.target.value)}
									placeholder="01.01.2026"
									value={field.state.value}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="endDate"
				/>
				<Button
					className={"md:col-span-2"}
					disabled={createReceipt.isPending}
					form="form-create-receipt-expense"
					type="submit"
				>
					Erstellen
				</Button>
			</FieldGroup>
		</form>
	);
}

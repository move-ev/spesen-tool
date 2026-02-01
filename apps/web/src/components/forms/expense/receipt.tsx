"use client";

import { NumberField } from "@base-ui/react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@zemio/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@zemio/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@zemio/ui/components/input-group";
import { Textarea } from "@zemio/ui/components/textarea";
import { UploadDropzone } from "@zemio/ui/components/upload-dropzone";
import { formatDate } from "date-fns";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { DatePicker } from "@/components/date-picker";
import { usePresignedUpload } from "@/hooks/use-presigned-upload";
import { formatBytes } from "@/lib/utils";
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
	const router = useRouter();
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

	const { uploadFiles, isUploading } = usePresignedUpload({
		reportId,
		visibility: "PRIVATE",
	});

	const form = useForm({
		defaultValues: {
			description: "",
			amount: 0,
			startDate: formatDate(new Date(), "dd.MM.yyyy"),
			endDate: formatDate(new Date(), "dd.MM.yyyy"),
			type: "RECEIPT",
			reportId,
			attachmentIds: [] as string[],
			files: [] as File[],
		},
		validators: {
			onSubmit: createReceiptExpenseSchema.and(
				z.object({ files: z.file().array() }),
			),
		},
		onSubmit: async ({ value }) => {
			try {
				// Upload files first
				const attachmentIds = await uploadFiles(value.files);

				// Create expense with attachment IDs
				createReceipt.mutate({
					amount: value.amount,
					description: value.description,
					startDate: value.startDate,
					endDate: value.endDate,
					type: "RECEIPT",
					reportId,
					attachmentIds,
				});

				router.push(`/reports/${reportId}`);
			} catch (error) {
				// Error already toasted by hook
				console.error("Upload failed:", error);
			}
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
				<form.Field
					children={(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field className="md:col-span-2" data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Betrag</FieldLabel>
								<NumberField.Root
									format={{
										style: "decimal",
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}}
									locale={"de-DE"}
									onValueChange={(value) => field.handleChange(value ?? 0)}
									value={field.state.value}
								>
									<NumberField.Group>
										<InputGroup className="overflow-hidden opacity-100!">
											<NumberField.Input
												render={
													<InputGroupInput
														aria-invalid={isInvalid}
														autoComplete="off"
														id={field.name}
														inputMode="decimal"
														name={field.name}
														placeholder="0,00"
													/>
												}
											/>
											<InputGroupAddon
												align={"inline-end"}
												className="flex w-8 items-center justify-center overflow-hidden border-l bg-muted p-2"
											>
												<span>€</span>
											</InputGroupAddon>
										</InputGroup>
									</NumberField.Group>
								</NumberField.Root>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="amount"
				/>
				<form.Field
					children={(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

						const MAX_FILE_AMOUNT = 5;

						return (
							<Field className="md:col-span-2" data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Anhänge</FieldLabel>
								<UploadDropzone
									description={{
										maxFiles: MAX_FILE_AMOUNT,
										maxFileSize: "5MB",
									}}
									id={field.name}
									uploadOverride={(files) => {
										field.handleChange(Array.from([...field.state.value, ...files]));
									}}
								/>
								{field.state.value.length > 0 && (
									<div className="mt-4 grid gap-4">
										{field.state.value.map((file) => (
											<div className="flex items-center justify-between" key={file.name}>
												<div>
													<p>{file.name}</p>
													<p className="text-muted-foreground text-xs">
														{formatBytes(file.size)}
													</p>
												</div>
												<Button
													onClick={() => {
														field.handleChange(
															field.state.value.filter((f) => f.name !== file.name),
														);
													}}
													size="icon-sm"
													variant="destructive"
												>
													<XIcon className="size-4" />
												</Button>
											</div>
										))}
									</div>
								)}
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="files"
				/>
				<Button
					className={"md:col-span-2"}
					disabled={createReceipt.isPending || isUploading}
					form="form-create-receipt-expense"
					type="submit"
				>
					Erstellen
				</Button>
			</FieldGroup>
		</form>
	);
}

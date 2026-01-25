"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import { updateOrganizationSchema } from "@/lib/validators/organization";
import { api } from "@/trpc/react";
import { Button } from "../../ui/button";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "../../ui/field";
import { Input } from "../../ui/input";

export function OrganizationGeneralSettingsForm({
	...props
}: React.ComponentProps<"form">) {
	const utils = api.useUtils();
	const [data] = api.organization.get.useSuspenseQuery({});

	const updateOrganization = api.organization.update.useMutation({
		onSuccess: () => {
			toast.success("Organisation wurden erfolgreich gespeichert");
			utils.organization.get.invalidate();
		},
		onError: (error) => {
			toast.error("Fehler beim Speichern der Organisation", {
				description: error.message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	const form = useForm({
		defaultValues: {
			name: data?.name ?? "",
		},
		validators: {
			onSubmit: updateOrganizationSchema,
		},
		onSubmit: ({ value }) => {
			updateOrganization.mutate(value);
		},
	});

	return (
		<form
			id="form-org-general"
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			<FieldGroup className="space-y-8">
				<form.Field name="name">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field className="grid grid-cols-2 gap-6" data-invalid={isInvalid}>
								<FieldContent>
									<FieldLabel htmlFor={field.name}>Organisationsname</FieldLabel>
									<FieldDescription>
										Der Name der Organisation. Dieser ist öffentlich sichtbar.
									</FieldDescription>
								</FieldContent>
								<Input
									aria-invalid={isInvalid}
									autoComplete="off"
									className="bg-background"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Deine Organisation"
									value={field.state.value}
								/>

								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<Field className="grid grid-cols-2 gap-6">
					<FieldContent>
						<FieldLabel>Slug</FieldLabel>
						<FieldDescription>
							Wird verwendet um deine Organisation eindeutig zu identifizieren. Dieser
							kann nicht geändert werden.
						</FieldDescription>
					</FieldContent>
					<InputGroup>
						<InputGroupAddon>
							<InputGroupText>https://spesen-tool.com/</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput
							className="disabled:opacity-100"
							disabled
							onChange={() => void 0}
							readOnly
							value={data?.slug ?? ""}
						/>
					</InputGroup>
				</Field>

				<div className="flex justify-end">
					<Button
						disabled={updateOrganization.isPending}
						form="form-org-general"
						type="submit"
					>
						Speichern
					</Button>
				</div>
			</FieldGroup>
		</form>
	);
}

"use client";

import { useForm } from "@tanstack/react-form";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBusinessUnitSchema } from "@/lib/validators";
import { api } from "@/trpc/react";

export function CreateBusinessUnit({
	...props
}: React.ComponentProps<typeof Button>) {
	const utils = api.useUtils();
	const [open, setOpen] = React.useState(false);

	const createBusinessUnit = api.businessUnit.create.useMutation({
		onSuccess: () => {
			setOpen(false);
			form.reset();
			toast.success("Geschäftseinheit erfolgreich erstellt");
			utils.businessUnit.listAll.invalidate();
		},
		onError: (error) => {
			toast.error("Fehler beim Erstellen der Geschäftseinheit", {
				description: error.message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
		},
		validators: {
			onSubmit: createBusinessUnitSchema,
		},
		onSubmit: (value) => {
			createBusinessUnit.mutate(value.value);
		},
	});

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger render={<Button {...props} />} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Neue Geschäftseinheit</DialogTitle>
					<DialogDescription>
						Erstelle einen neuen Geschäftseinheit
					</DialogDescription>
				</DialogHeader>
				<div className="">
					<form
						id="form-create-business-unit"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Field name="name">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Name</FieldLabel>
											<Input
												aria-invalid={isInvalid}
												id={field.name}
												name={field.name}
												onChange={(e) => field.handleChange(e.target.value)}
												value={field.state.value}
											/>
										</Field>
									);
								}}
							</form.Field>
							<Button
								disabled={createBusinessUnit.isPending}
								form="form-create-business-unit"
								type="submit"
							>
								Erstellen
							</Button>
						</FieldGroup>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}

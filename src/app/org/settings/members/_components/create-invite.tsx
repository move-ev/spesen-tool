"use client";

import { useForm } from "@tanstack/react-form";
import { UserPlusIcon } from "lucide-react";
import { useState } from "react";
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
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createInvitationSchema } from "@/lib/validators/organization";
import { api } from "@/trpc/react";

const ROLES = [
	{
		label: "Mitglied",
		value: "member",
		desc:
			"Kann Reports erstellen und bearbeiten. Hat keine administrativen Rechte.",
	},
	{
		label: "Admin",
		value: "admin",
		desc:
			"Hat die gleichen Berechtigungen wie der Owner, kann jedoch die Organisation nicht löschen.",
	},
	{
		label: "Owner",
		value: "owner",
		desc: "Vollständige Kontrolle über die Organisation und alle Benutzer.",
	},
] as const;

export function CreateInvite({
	...props
}: React.ComponentProps<typeof Button>) {
	const utils = api.useUtils();
	const [open, setOpen] = useState(false);

	const inviteMember = api.invitation.create.useMutation({
		onSuccess: (invitation) => {
			toast.success("Einladung erfolgreich erstellt", {
				description: `Einladung an ${invitation.email} erfolgreich erstellt`,
			});
			utils.invitation.listPending.invalidate();
			setOpen(false);
		},
		onError: (error) => {
			toast.error("Fehler beim Erstellen der Einladung", {
				description: error.message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	const form = useForm({
		defaultValues: {
			email: "",
			role: "member",
		},
		validators: {
			onSubmit: createInvitationSchema,
		},
		onSubmit: (value) => {
			inviteMember.mutate({
				email: value.value.email,
				role: value.value.role as "member" | "admin" | "owner",
			});
		},
	});
	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger render={<Button {...props} />} />
			<DialogContent className={"md:max-w-md"}>
				<DialogHeader>
					<div className="flex items-center justify-center">
						<div className="rounded-md bg-muted p-2">
							<UserPlusIcon className="size-4" />
						</div>
					</div>
					<DialogTitle className="mt-2 text-center">Mitglieder einladen</DialogTitle>
					<DialogDescription className="text-center">
						Erstelle eine Einladung für ein neues Mitglied.
					</DialogDescription>
				</DialogHeader>

				<form
					className="mt-4"
					id="form-create-invite"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field name="email">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel>E-Mail</FieldLabel>
										<Input
											aria-invalid={isInvalid}
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="E-Mail"
											value={field.state.value}
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="role">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel>Rolle</FieldLabel>
										<Select
											defaultValue={ROLES[0].value}
											items={ROLES}
											onValueChange={(value) => field.handleChange(value ?? "")}
											value={field.state.value}
										>
											<SelectTrigger
												aria-invalid={isInvalid}
												data-invalid={isInvalid}
												name={field.name}
												onBlur={field.handleBlur}
											>
												<SelectValue placeholder="Rolle auswählen" />
											</SelectTrigger>
											<SelectContent className={"h-fit"}>
												<SelectGroup>
													{ROLES.map((role) => (
														<SelectItem key={role.value} value={role.value}>
															<span className="block max-w-full grow whitespace-normal">
																<span className="block font-medium">{role.label}</span>
																<span className="block text-muted-foreground text-xs">
																	{role.desc}
																</span>
															</span>
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								);
							}}
						</form.Field>
						<Button
							disabled={inviteMember.isPending}
							form="form-create-invite"
							type="submit"
						>
							Einladen
						</Button>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}

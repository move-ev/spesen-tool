"use client";

import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { generateSlugFromName } from "@/lib/utils/organization";
import { createOrganizationSchema } from "@/lib/validators/organization";
import { authClient } from "@/server/better-auth/client";
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
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "../ui/input-group";

const SLUG_CHECK_DEBOUNCE_MS = 500;

export function CreateOrganizationForm({
	...props
}: React.ComponentProps<"form">) {
	// Track if user has manually edited the slug field
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
	// Track slug availability check state
	const [isCheckingSlug, setIsCheckingSlug] = useState(false);
	const [slugError, setSlugError] = useState<string | null>(null);
	// Debounce timer ref
	const slugCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const createOrganization = api.organization.create.useMutation({
		onSuccess: () => {
			toast.success("Organisation erfolgreich erstellt");
		},
		onError: (error) => {
			toast.error("Fehler beim Erstellen der Organisation", {
				description: error.message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			slug: "",
		},
		validators: {
			onSubmit: createOrganizationSchema,
		},
		onSubmit: (value) => {
			// Don't submit if slug is taken
			if (slugError) return;
			createOrganization.mutate(value.value);
		},
	});

	// Debounced slug availability check
	const checkSlugAvailability = useCallback(async (slug: string) => {
		if (!slug || slug.length < 2) {
			setSlugError(null);
			return;
		}

		setIsCheckingSlug(true);
		try {
			const { error } = await authClient.organization.checkSlug({
				slug,
			});

			// When slug is taken, API returns error with code "SLUG_IS_TAKEN"
			if (error?.code === "SLUG_IS_TAKEN") {
				setSlugError("Dieser Slug ist bereits vergeben");
			} else {
				setSlugError(null);
			}
		} catch {
			// Don't show error on network issues
			setSlugError(null);
		} finally {
			setIsCheckingSlug(false);
		}
	}, []);

	// Handle slug change with debounced availability check
	const handleSlugChange = useCallback(
		(value: string, fieldHandleChange: (value: string) => void) => {
			setSlugManuallyEdited(true);
			fieldHandleChange(value);
			setSlugError(null);

			// Clear existing timer
			if (slugCheckTimerRef.current) {
				clearTimeout(slugCheckTimerRef.current);
			}

			// Set new debounced check
			slugCheckTimerRef.current = setTimeout(() => {
				void checkSlugAvailability(value);
			}, SLUG_CHECK_DEBOUNCE_MS);
		},
		[checkSlugAvailability],
	);

	// Handle name blur - generate slug suggestion if not manually edited
	const handleNameBlur = useCallback(
		(
			name: string,
			fieldHandleBlur: () => void,
			setSlugValue: (value: string) => void,
		) => {
			fieldHandleBlur();

			if (!slugManuallyEdited && name.trim()) {
				const generatedSlug = generateSlugFromName(name);
				setSlugValue(generatedSlug);
				// Check availability for generated slug
				void checkSlugAvailability(generatedSlug);
			}
		},
		[slugManuallyEdited, checkSlugAvailability],
	);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (slugCheckTimerRef.current) {
				clearTimeout(slugCheckTimerRef.current);
			}
		};
	}, []);

	return (
		<form
			id="form-create-organization"
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			<FieldGroup>
				<form.Field name="name">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Name</FieldLabel>
								<Input
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={() =>
										handleNameBlur(field.state.value, field.handleBlur, (slug) =>
											form.setFieldValue("slug", slug),
										)
									}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Deine Organisation"
									value={field.state.value}
								/>
								<FieldDescription>
									Gib deiner Organisaton einen Namen. Dieser ist öffentlich sichtbar.
								</FieldDescription>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>{" "}
				<form.Field name="slug">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid || Boolean(slugError)}>
								<FieldLabel htmlFor={field.name}>Slug</FieldLabel>
								<InputGroup>
									<InputGroupAddon>
										<InputGroupText>https://spesen-tool.com/</InputGroupText>
									</InputGroupAddon>
									<InputGroupInput
										aria-invalid={isInvalid || Boolean(slugError)}
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(e) => handleSlugChange(e.target.value, field.handleChange)}
										placeholder="your-org"
										type="text"
										value={field.state.value}
									/>
								</InputGroup>
								<FieldDescription>
									Über den Slug kann deine Organisation eindeutig identifiziert werden.
									{isCheckingSlug && " Prüfe Verfügbarkeit..."}
								</FieldDescription>
								{}
								{(isInvalid || slugError) && (
									<FieldError
										errors={[
											...(slugError ? [{ message: slugError }] : []),
											...field.state.meta.errors,
										]}
									/>
								)}
							</Field>
						);
					}}
				</form.Field>
				<Button
					disabled={createOrganization.isPending}
					form="form-create-organization"
					type="submit"
				>
					Erstellen
				</Button>
			</FieldGroup>
		</form>
	);
}

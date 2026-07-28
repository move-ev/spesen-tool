"use client";

import { useForm } from "@tanstack/react-form";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
	Input,
} from "@zemio/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSaveBar } from "@/components/save-bar";
import { api } from "@/trpc/react";
import {
	SettingsCard,
	SettingsCardContent,
	SettingsCardLabel,
} from "./settings-card";
import { SettingsSubtitle, SettingsTitle } from "./settings-typography";

function UserSettingsGeneral() {
	const t = useTranslations("modules.settings.preferences.general");

	return (
		<main className="py-16">
			<div className="container max-w-4xl space-y-1">
				<SettingsTitle>{t("title")}</SettingsTitle>
				<SettingsSubtitle>{t("description")}</SettingsSubtitle>
			</div>
			<div className="container mt-12 max-w-4xl">
				<SettingsCard>
					<SettingsCardLabel>{t("sectionProfile")}</SettingsCardLabel>
					<SettingsCardContent>
						<ProfileForm />
					</SettingsCardContent>
				</SettingsCard>
			</div>
		</main>
	);
}

const PROFILE_FORM_ID = "profile-form";

function ProfileForm() {
	const t = useTranslations("modules.settings.preferences.general");
	const utils = api.useUtils();
	const [user] = api.user.get.useSuspenseQuery();

	const updateName = api.user.updateName.useMutation({
		onSuccess: () => {
			void utils.user.get.invalidate();
		},
		onError: (error) => {
			toast.error(t("saveErrorTitle"), {
				description: error.message ?? t("saveErrorFallback"),
			});
		},
	});

	const form = useForm({
		defaultValues: {
			name: user.name,
			email: user.email,
			image: user.image,
		},
		onSubmit: async ({ value }) => {
			const name = value.name.trim();
			if (!name) {
				return;
			}
			try {
				await updateName.mutateAsync({ name });
				form.reset({ ...value, name });
			} catch {
				// error toast handled by the mutation's onError; form stays dirty
			}
		},
	});

	useSaveBar(PROFILE_FORM_ID, form);

	return (
		<form
			id={PROFILE_FORM_ID}
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<form.Field name="name">
				{({ state, ...field }) => {
					const isInvalid = !state.meta.isValid && state.meta.isTouched;

					return (
						<Field
							aria-invalid={isInvalid}
							className="grid grid-cols-2 gap-8 px-4 py-6"
						>
							<FieldContent>
								<FieldLabel htmlFor={field.name}>{t("nameAriaLabel")}</FieldLabel>
								<FieldDescription>{t("nameDescription")}</FieldDescription>
							</FieldContent>
							<div>
								<Input
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={t("nameLabel")}
									value={state.value}
								/>
								{isInvalid && <FieldError errors={state.meta.errors} />}
							</div>
						</Field>
					);
				}}
			</form.Field>
			<form.Field name="email">
				{({ state, ...field }) => {
					const isInvalid = !state.meta.isValid && state.meta.isTouched;

					return (
						<Field
							aria-invalid={isInvalid}
							className="grid grid-cols-2 gap-8 px-4 py-6"
						>
							<FieldContent>
								<FieldLabel htmlFor={field.name}>{t("emailLabel")}</FieldLabel>
								<FieldDescription>{t("emailDescription")}</FieldDescription>
							</FieldContent>
							<div>
								<Input
									aria-invalid={isInvalid}
									disabled
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={t("emailLabel")}
									value={state.value}
								/>
								{isInvalid && <FieldError errors={state.meta.errors} />}
							</div>
						</Field>
					);
				}}
			</form.Field>
		</form>
	);
}

export { UserSettingsGeneral };

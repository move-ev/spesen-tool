"use client";

import { useForm } from "@tanstack/react-form";
import { NotificationPreference } from "@zemio/db/enums";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLegend,
	Label,
} from "@zemio/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSaveBar } from "@/components/save-bar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { updatePreferencesSchema } from "@/lib/validators";
import { api } from "@/trpc/react";
import {
	SettingsCard,
	SettingsCardContent,
	SettingsCardLabel,
} from "./settings-card";
import { SettingsSubtitle, SettingsTitle } from "./settings-typography";

function UserSettingsNotifications({
	className,
	...props
}: React.ComponentProps<"main">) {
	const t = useTranslations("modules.settings.preferences.notifications");

	return (
		<main className={cn("py-16", className)} {...props}>
			<div className="container max-w-4xl space-y-1">
				<SettingsTitle>{t("title")}</SettingsTitle>
				<SettingsSubtitle>{t("description")}</SettingsSubtitle>
			</div>
			<div className="container mt-12 max-w-4xl">
				<SettingsCard>
					<SettingsCardLabel>{t("sectionNotifications")}</SettingsCardLabel>
					<SettingsCardContent>
						<NotificationsForm />
					</SettingsCardContent>
				</SettingsCard>
			</div>
		</main>
	);
}

const NOTIFICATIONS_FORM_ID = "notifications-form";

function NotificationsForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const t = useTranslations("modules.settings.preferences.notifications");
	const utils = api.useUtils();
	const [preferences] = api.preferences.getOwn.useSuspenseQuery();

	const updatePreferences = api.preferences.updateOwn.useMutation({
		onSuccess: () => {
			utils.preferences.getOwn.invalidate();
		},
		onError: (error) => {
			toast.error(t("saveErrorTitle"), {
				description: error.message ?? t("saveErrorFallback"),
			});
		},
	});

	const form = useForm({
		defaultValues: {
			notificationPreference: preferences.notifications,
		},
		validators: {
			onSubmit: updatePreferencesSchema,
		},
		onSubmit: async ({ value }) => {
			updatePreferences.mutate({
				notificationPreference: value.notificationPreference,
			});

			const preference = value.notificationPreference;
			if (!preference) {
				return;
			}
			try {
				await updatePreferences.mutateAsync({ notificationPreference: preference });
				form.reset({ ...value, notificationPreference: preference });
			} catch {}
		},
	});

	useSaveBar(NOTIFICATIONS_FORM_ID, form);

	return (
		<form
			className={cn("", className)}
			data-slot="notifications-form"
			id={NOTIFICATIONS_FORM_ID}
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			<form.Field name="notificationPreference">
				{({ state, ...field }) => {
					const isInvalid = state.meta.isTouched && !state.meta.isValid;
					return (
						<Field
							className="grid gap-4 md:grid-cols-2 md:gap-8"
							data-invalid={isInvalid}
						>
							<FieldContent>
								<FieldLegend className="mb-0" variant="label">
									{t("fieldLabel")}
								</FieldLegend>
								<FieldDescription>{t("fieldDescription")}</FieldDescription>
							</FieldContent>
							<RadioGroup
								className="gap-6"
								onBlur={field.handleBlur}
								onValueChange={field.handleChange}
								value={state.value}
							>
								<div className="flex items-start gap-3">
									<RadioGroupItem id="all" value={NotificationPreference.ALL} />
									<div className="flex flex-col gap-1">
										<Label htmlFor="all">{t("allTitle")}</Label>
										<FieldDescription className="max-w-prose">
											{t("allDescription")}
										</FieldDescription>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<RadioGroupItem
										id="status"
										value={NotificationPreference.STATUS_CHANGES}
									/>
									<div className="flex flex-col gap-1">
										<Label htmlFor="status">{t("statusTitle")}</Label>
										<FieldDescription className="max-w-prose">
											{t("statusDescription")}
										</FieldDescription>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<RadioGroupItem id="none" value={NotificationPreference.NONE} />
									<div className="flex flex-col gap-1">
										<Label htmlFor="none">{t("noneTitle")}</Label>
										<FieldDescription className="max-w-prose">
											{t("noneDescription")}
										</FieldDescription>
									</div>
								</div>
							</RadioGroup>
						</Field>
					);
				}}
			</form.Field>
		</form>
	);
}

export { UserSettingsNotifications };

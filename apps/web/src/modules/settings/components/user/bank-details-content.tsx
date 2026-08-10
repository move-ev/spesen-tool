"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react";
import { useForm } from "@tanstack/react-form";
import {
	Button,
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	Skeleton,
} from "@zemio/ui";
import { format } from "date-fns";
import { LoaderIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { toast } from "sonner";
import z from "zod";
import {
	Box,
	BoxItem,
	BoxItemContent,
	BoxItemDescription,
	BoxItemTitle,
} from "@/components/box";
import { IbanInput } from "@/components/ui/iban-input";
import type { WithHandle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ibanSchema } from "@/lib/validators";
import { api } from "@/trpc/react";
import {
	SettingsCard,
	SettingsCardContent,
	SettingsCardLabel,
} from "../settings-card";
import { SettingsError } from "../settings-error";
import { SettingsSubtitle, SettingsTitle } from "../settings-typography";

function UserSettingsBankDetails({
	className,
	...props
}: React.ComponentProps<"main">) {
	const t = useTranslations("modules.settings.banking");

	return (
		<main className={cn("py-16", className)} data-slot="component" {...props}>
			<div className="container flex max-w-4xl flex-wrap items-start justify-between gap-6">
				<div className="space-y-1">
					<SettingsTitle>{t("title")}</SettingsTitle>
					<SettingsSubtitle>{t("description")}</SettingsSubtitle>
				</div>
				<UserSettingsBankDetailsActions className="flex items-center justify-center gap-4" />
			</div>
			<div className="container mt-12 max-w-4xl">
				<BankDetailsList />
			</div>
		</main>
	);
}

function UserSettingsBankDetailsActions({
	className,
	...props
}: React.ComponentProps<"div">) {
	const t = useTranslations("modules.settings.banking");

	const createHandleRef = React.useRef<CreateBankDetailsHandle | null>(null);
	if (!createHandleRef.current)
		createHandleRef.current = createBankDetailsCreateHandle();
	const createHandle = createHandleRef.current;

	return (
		<>
			<div
				className={cn("", className)}
				data-slot="org-settings-cost-units-actions"
				{...props}
			>
				<CreateBankDetailsDialogTrigger handle={createHandle}>
					{t("createButton")} <PlusIcon />
				</CreateBankDetailsDialogTrigger>
			</div>
			<CreateBankDetails handle={createHandle} />
		</>
	);
}

// ===== CREATE BANK DETAILS =================================================================

type CreateBankDetailsHandle = ReturnType<typeof DialogPrimitive.createHandle>;

const CREATE_BANK_DETAILS_FORM_ID = "create-bank-details-form";

function createBankDetailsCreateHandle(): CreateBankDetailsHandle {
	return DialogPrimitive.createHandle();
}

function CreateBankDetailsDialogTrigger({
	handle,
	...props
}: React.ComponentProps<typeof Button> & WithHandle) {
	return (
		<DialogPrimitive.Trigger
			data-slot="create-bank-details-dialog-trigger"
			handle={handle}
			render={<Button {...props} />}
		/>
	);
}

const createBankingDetailsSchema = z.object({
	title: z.string().min(1),
	iban: ibanSchema,
	fullName: z.string().min(1),
});

function CreateBankDetails({
	handle,
	closeOnSuccess = true,
}: WithHandle & {
	closeOnSuccess?: boolean;
}) {
	const t = useTranslations("modules.settings.banking.createDialog");
	const utils = api.useUtils();

	const createBankingDetails = api.bankingDetails.create.useMutation({
		onSuccess: () => {
			utils.bankingDetails.list.invalidate();

			closeOnSuccess && handle.close();
			form.reset();
		},
		onError: (error) => {
			toast.error(t("saveErrorTitle"), {
				description: error.message ?? t("saveErrorFallback"),
			});
		},
	});

	const form = useForm({
		defaultValues: {
			title: "",
			iban: "",
			fullName: "",
		},
		validators: {
			onSubmit: createBankingDetailsSchema,
		},
		onSubmit: (value) => {
			createBankingDetails.mutate(value.value);
		},
	});

	return (
		<Dialog data-slot="create-bank-details" handle={handle}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<DialogBody>
					<form
						id={CREATE_BANK_DETAILS_FORM_ID}
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<FieldGroup className="grid gap-8">
							<form.Field name="title">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>{t("titleLabel")}</FieldLabel>
											<Input
												aria-invalid={isInvalid}
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												value={field.state.value}
											/>
											<FieldDescription>{t("titleDescription")}</FieldDescription>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									);
								}}
							</form.Field>
							<form.Field name="iban">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>{t("ibanLabel")}</FieldLabel>
											<IbanInput
												aria-invalid={isInvalid}
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(value) => field.handleChange(value)}
												value={field.state.value}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									);
								}}
							</form.Field>
							<form.Field name="fullName">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>{t("nameLabel")}</FieldLabel>
											<Input
												aria-invalid={isInvalid}
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												value={field.state.value}
											/>
											<FieldDescription>{t("nameDescription")}</FieldDescription>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									);
								}}
							</form.Field>
						</FieldGroup>
					</form>
				</DialogBody>
				<DialogFooter>
					<form.Subscribe
						selector={(s) => ({
							isDefaultValue: s.isDefaultValue,
							isSubmitting: s.isSubmitting,
							canSubmit: s.canSubmit,
						})}
					>
						{({ canSubmit, isDefaultValue, isSubmitting }) => {
							const loading = createBankingDetails.isPending || isSubmitting;
							const isSubmittable = !loading && canSubmit && !isDefaultValue;

							return (
								<Button
									disabled={!isSubmittable}
									form={CREATE_BANK_DETAILS_FORM_ID}
									type="submit"
								>
									{createBankingDetails.isPending ? (
										<>
											<LoaderIcon className="animate-spin" />
											{t("submitCreating")}
										</>
									) : (
										t("submitIdle")
									)}
								</Button>
							);
						}}
					</form.Subscribe>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ===== BANK DETAILS LIST ===================================================================

function BankDetailsList({ className, ...props }: React.ComponentProps<"div">) {
	const t = useTranslations("modules.settings.banking");
	const tShared = useTranslations("modules.settings.shared");
	const { data: details, isPending, error } = api.bankingDetails.list.useQuery();

	if (isPending) {
		return <Skeleton className="min-h-32 w-full" />;
	}

	if (error) {
		return (
			<SettingsError
				description={tShared("unknownError")}
				message={t("loadErrorFallback")}
			/>
		);
	}

	if (details.length === 0) {
		return (
			<Box>
				<BoxItem className="min-h-24">
					<BoxItemContent className="flex w-full flex-col items-center justify-center text-center">
						<BoxItemTitle>{t("emptyTitle")}</BoxItemTitle>
						<BoxItemDescription>{t("emptyDescription")}</BoxItemDescription>
					</BoxItemContent>
				</BoxItem>
			</Box>
		);
	}

	return (
		<SettingsCard
			className={cn("", className)}
			data-slot="bank-details-list"
			{...props}
		>
			<SettingsCardLabel>{t("listHeading")}</SettingsCardLabel>
			<SettingsCardContent className="px-4 py-6">
				<ul>
					{details.map((detail) => (
						<li
							className="border-base-200 border-b py-4 first:pt-0 last:border-b-0 last:pb-0"
							key={detail.id}
						>
							<p className="font-medium text-base-800 text-sm">{detail.title}</p>
							<p className="mt-0.5 text-base-500 text-xs">
								{t("createdOn", {
									date: format(detail.createdAt, "dd.MM.yyyy"),
									time: format(detail.createdAt, "HH:mm"),
								})}
							</p>
						</li>
					))}
				</ul>
			</SettingsCardContent>
		</SettingsCard>
	);
}

export { UserSettingsBankDetails };

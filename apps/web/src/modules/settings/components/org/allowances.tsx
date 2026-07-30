"use client";

import { NumberField } from "@base-ui/react";
import { useForm } from "@tanstack/react-form";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
	Skeleton,
} from "@zemio/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type z from "zod";
import { useSaveBar } from "@/components/save-bar";
import { cn } from "@/lib/utils";
import {
	updateMealAllowancesSchema,
	updateTravelAllowancesSchema,
} from "@/lib/validators";
import { api } from "@/trpc/react";
import {
	SettingsCard,
	SettingsCardContent,
	SettingsCardLabel,
} from "../settings-card";
import { SettingsError } from "../settings-error";
import { SettingsSubtitle, SettingsTitle } from "../settings-typography";

function OrgSettingsAllowances({
	className,
	...props
}: React.ComponentProps<"main">) {
	const t = useTranslations("modules.settings.allowances");

	return (
		<main
			className={cn("py-16", className)}
			data-slot="org-settings-allowances"
			{...props}
		>
			<div className="container max-w-4xl space-y-1">
				<SettingsTitle>{t("title")}</SettingsTitle>
				<SettingsSubtitle>{t("description")}</SettingsSubtitle>
			</div>
			<div className="container mt-12 max-w-4xl">
				<TravelAllowancesSection />
			</div>
			<div className="container mt-12 max-w-4xl">
				<MealAllowancesSection />
			</div>
		</main>
	);
}

// ======= TRAVEL ===========================================================================

function TravelAllowancesSection({
	className,
	...props
}: React.ComponentProps<"div">) {
	const t = useTranslations("modules.settings.allowances");
	const query = api.settings.get.useQuery();

	if (query.isPending) {
		return <Skeleton className={cn("h-64 w-full", className)} {...props} />;
	}

	if (query.error) {
		const { error } = query;

		return (
			<SettingsError
				description={error.data?.code ?? "An unkown error ocurred."}
				message={error.message}
			/>
		);
	}

	const { data } = query;

	return (
		<SettingsCard
			className={cn(className)}
			data-slot="org-settings-travel-allowances"
			{...props}
		>
			<SettingsCardLabel>{t("sections.travel")}</SettingsCardLabel>
			<SettingsCardContent>
				<TravelAllowancesForm
					defaultValues={{
						kilometerRate: data.kilometerRate,
					}}
				/>
			</SettingsCardContent>
		</SettingsCard>
	);
}

const TRAVEL_ALLOWANCES_FORM_ID = "org-update-travel-allowances-form";

type TravelAllowancesFormValues = z.infer<typeof updateTravelAllowancesSchema>;
interface TravelAllowancesFormProps extends React.ComponentProps<"form"> {
	defaultValues: TravelAllowancesFormValues;
}

function TravelAllowancesForm({
	defaultValues,
	...props
}: TravelAllowancesFormProps) {
	const t = useTranslations("modules.settings.allowances");
	const utils = api.useUtils();

	const updateMutation = api.settings.updateTravelAllowances.useMutation({
		onSuccess: (updated) => {
			utils.settings.get.setData(undefined, updated);
			void utils.settings.get.invalidate();
		},
		onError: (error) => {
			toast.error(t("saveErrorTitle"), {
				description: error.message ?? t("saveErrorFallback"),
			});
		},
	});

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: updateTravelAllowancesSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const updated = await updateMutation.mutateAsync(value);
				// Re-baseline so the form goes clean and the save bar can complete.
				form.reset(updated);
			} catch {
				// error toast handled by the mutation's onError; form stays dirty
			}
		},
	});

	useSaveBar(TRAVEL_ALLOWANCES_FORM_ID, form);

	return (
		<form
			data-slot="travel-allowances-form"
			id={TRAVEL_ALLOWANCES_FORM_ID}
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			<form.Field name={"kilometerRate"}>
				{({ state, ...field }) => {
					const isInvalid = !state.meta.isValid && state.meta.isTouched;

					return (
						<Field data-invalid={isInvalid}>
							<FieldContent>
								<FieldLabel htmlFor={field.name}>{t("kilometerRate.label")}</FieldLabel>
								<FieldDescription>{t("kilometerRate.description")}</FieldDescription>
							</FieldContent>
							<div className="space-y-2">
								<NumberField.Root
									format={{
										style: "decimal",
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}}
									locale={"de-DE"}
									onBlur={field.handleBlur}
									onValueChange={(value) => field.handleChange(value ?? 0)}
									value={state.value}
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
												className="flex w-8 items-center justify-center overflow-hidden border-l bg-base-50 p-2"
											>
												<span>€</span>
											</InputGroupAddon>
										</InputGroup>
									</NumberField.Group>
								</NumberField.Root>

								{isInvalid && <FieldError errors={state.meta.errors} />}
							</div>
						</Field>
					);
				}}
			</form.Field>
		</form>
	);
}

// ======= MEAL ============================================================================

function MealAllowancesSection({
	className,
	...props
}: React.ComponentProps<"div">) {
	const t = useTranslations("modules.settings.allowances");
	const query = api.settings.get.useQuery();

	if (query.isPending) {
		return <Skeleton className={cn("h-64 w-full", className)} {...props} />;
	}

	if (query.error) {
		const { error } = query;

		return (
			<SettingsError
				description={error.data?.code ?? "An unkown error ocurred."}
				message={error.message}
			/>
		);
	}

	const { data } = query;

	return (
		<SettingsCard
			className={cn(className)}
			data-slot="org-settings-meal-allowances"
			{...props}
		>
			<SettingsCardLabel>{t("sections.food")}</SettingsCardLabel>
			<SettingsCardContent>
				<MealAllowancesForm
					defaultValues={{
						breakfastDeduction: data.breakfastDeduction,
						dailyFoodAllowance: data.dailyFoodAllowance,
						dinnerDeduction: data.dinnerDeduction,
						lunchDeduction: data.lunchDeduction,
					}}
				/>
			</SettingsCardContent>
		</SettingsCard>
	);
}

const MEAL_ALLOWANCES_FORM_ID = "org-update-meal-allowances-form";

type MealAllowancesFormValues = z.infer<typeof updateMealAllowancesSchema>;
interface MealAllowancesFormProps extends React.ComponentProps<"form"> {
	defaultValues: MealAllowancesFormValues;
}

function MealAllowancesForm({
	defaultValues,
	...props
}: MealAllowancesFormProps) {
	const t = useTranslations("modules.settings.allowances");
	const utils = api.useUtils();

	const updateMutation = api.settings.updateMealAllowances.useMutation({
		onSuccess: (updated) => {
			utils.settings.get.setData(undefined, updated);
			void utils.settings.get.invalidate();
		},
		onError: (error) => {
			toast.error(t("saveErrorTitle"), {
				description: error.message ?? t("saveErrorFallback"),
			});
		},
	});

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: updateMealAllowancesSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const updated = await updateMutation.mutateAsync(value);
				// Re-baseline so the form goes clean and the save bar can complete.
				form.reset(updated);
			} catch {
				// error toast handled by the mutation's onError; form stays dirty
			}
		},
	});

	useSaveBar(MEAL_ALLOWANCES_FORM_ID, form);

	return (
		<form
			data-slot="meal-allowances-form"
			id={MEAL_ALLOWANCES_FORM_ID}
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			<form.Field name="dailyFoodAllowance">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field className="md:col-span-2" data-invalid={isInvalid}>
							<FieldContent>
								<FieldLabel htmlFor={field.name}>
									{t("dailyFoodAllowance.label")}
								</FieldLabel>
								<FieldDescription>
									{t("dailyFoodAllowance.description")}
								</FieldDescription>
							</FieldContent>
							<div className="space-y-2">
								<NumberField.Root
									format={{
										style: "decimal",
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}}
									locale={"de-DE"}
									onBlur={field.handleBlur}
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
							</div>
						</Field>
					);
				}}
			</form.Field>
			<form.Field name="breakfastDeduction">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<FieldContent>
								<FieldLabel htmlFor={field.name}>
									{t("breakfastDeduction.label")}
								</FieldLabel>
							</FieldContent>
							<div className="space-y-2">
								<NumberField.Root
									format={{
										style: "decimal",
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}}
									locale={"de-DE"}
									onBlur={field.handleBlur}
									onValueChange={(value) => field.handleChange(value ?? 0)}
									value={field.state.value}
								>
									<NumberField.Group>
										<InputGroup className="overflow-hidden">
											<InputGroupAddon align="inline-start">
												<InputGroupText>-</InputGroupText>
											</InputGroupAddon>
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
							</div>
						</Field>
					);
				}}
			</form.Field>
			<form.Field name="lunchDeduction">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<FieldContent>
								<FieldLabel htmlFor={field.name}>
									{t("lunchDeduction.label")}
								</FieldLabel>
							</FieldContent>
							<div className="space-y-2">
								<NumberField.Root
									format={{
										style: "decimal",
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}}
									locale={"de-DE"}
									onBlur={field.handleBlur}
									onValueChange={(value) => field.handleChange(value ?? 0)}
									value={field.state.value}
								>
									<NumberField.Group>
										<InputGroup className="overflow-hidden">
											<InputGroupAddon align="inline-start">
												<InputGroupText>-</InputGroupText>
											</InputGroupAddon>
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
							</div>
						</Field>
					);
				}}
			</form.Field>
			<form.Field name="dinnerDeduction">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<FieldContent>
								<FieldLabel htmlFor={field.name}>
									{t("dinnerDeduction.label")}
								</FieldLabel>
							</FieldContent>
							<div className="space-y-2">
								<NumberField.Root
									format={{
										style: "decimal",
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}}
									locale={"de-DE"}
									onBlur={field.handleBlur}
									onValueChange={(value) => field.handleChange(value ?? 0)}
									value={field.state.value}
								>
									<NumberField.Group>
										<InputGroup className="overflow-hidden">
											<InputGroupAddon align="inline-start">
												<InputGroupText>-</InputGroupText>
											</InputGroupAddon>
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
							</div>
						</Field>
					);
				}}
			</form.Field>
		</form>
	);
}

export { OrgSettingsAllowances };

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
} from "@zemio/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
				<SettingsCard>
					<SettingsCardLabel>{t("sections.travel")}</SettingsCardLabel>
					<SettingsCardContent>
						<TravelAllowancesForm />
					</SettingsCardContent>
				</SettingsCard>
			</div>
			<div className="container mt-12 max-w-4xl">
				<SettingsCard>
					<SettingsCardLabel>{t("sections.food")}</SettingsCardLabel>
					<SettingsCardContent>
						<MealAllowancesForm />
					</SettingsCardContent>
				</SettingsCard>
			</div>
		</main>
	);
}

const TRAVEL_ALLOWANCES_FORM_ID = "org-update-travel-allowances-form";

function TravelAllowancesForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const [settings] = api.settings.get.useSuspenseQuery();
	const t = useTranslations("modules.settings.allowances");
	const utils = api.useUtils();

	const updateMutation = api.settings.updateTravelAllowances.useMutation({
		onSuccess: () => {
			toast.success(t("savedToast"));
			utils.settings.get.invalidate();
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
			kilometerRate: settings.kilometerRate,
		},
		validators: {
			onSubmit: updateTravelAllowancesSchema,
		},
		onSubmit: ({ value }) => {
			updateMutation.mutate(value);
		},
	});

	useSaveBar(TRAVEL_ALLOWANCES_FORM_ID, form);

	return (
		<form
			className={cn("", className)}
			data-slot="travel-allowances-form"
			id={TRAVEL_ALLOWANCES_FORM_ID}
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

const MEAL_ALLOWANCES_FORM_ID = "org-update-meal-allowances-form";

function MealAllowancesForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const [settings] = api.settings.get.useSuspenseQuery();
	const t = useTranslations("modules.settings.allowances");
	const utils = api.useUtils();

	const updateMutation = api.settings.updateMealAllowances.useMutation({
		onSuccess: () => {
			toast.success(t("savedToast"));
			utils.settings.get.invalidate();
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
			dailyFoodAllowance: settings.dailyFoodAllowance,
			breakfastDeduction: settings.breakfastDeduction,
			lunchDeduction: settings.lunchDeduction,
			dinnerDeduction: settings.dinnerDeduction,
		},
		validators: {
			onSubmit: updateMealAllowancesSchema,
		},
		onSubmit: ({ value }) => {
			updateMutation.mutate(value);
		},
	});

	useSaveBar(MEAL_ALLOWANCES_FORM_ID, form);

	return (
		<form
			className={cn("", className)}
			data-slot="meal-allowances-form"
			id={MEAL_ALLOWANCES_FORM_ID}
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

"use client";

import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect, useRef, useState } from "react";
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
	NativeSelect,
	NativeSelectOptGroup,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { createCostUnitSchema } from "@/lib/validators";
import { api } from "@/trpc/react";

interface ExamplesInputProps {
	value: string[];
	onChange: (examples: string[]) => void;
	placeholder?: string;
}

interface InputItem {
	id: string;
	value: string;
}

let inputIdCounter = 0;
function generateInputId() {
	return `input-${++inputIdCounter}`;
}

function ExamplesInput({ value, onChange, placeholder }: ExamplesInputProps) {
	const [inputs, setInputs] = useState<InputItem[]>(() => [
		{ id: generateInputId(), value: "" },
	]);

	// Sync inputs when external value changes (e.g., form reset)
	const valueRef = useRef(value);
	useEffect(() => {
		if (valueRef.current !== value && value.length === 0) {
			setInputs([{ id: generateInputId(), value: "" }]);
		}
		valueRef.current = value;
	}, [value]);

	// Sync non-empty values to parent form (separate effect to avoid setState during render)
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	useEffect(() => {
		const nonEmptyValues = inputs
			.map((item) => item.value)
			.filter((v) => v.trim() !== "");
		onChangeRef.current(nonEmptyValues);
	}, [inputs]);

	const handleChange = useCallback((inputId: string, newValue: string) => {
		setInputs((prev) => {
			const index = prev.findIndex((item) => item.id === inputId);
			if (index === -1) return prev;

			const updated = [...prev];
			updated[index] = { id: inputId, value: newValue };

			// If the last input now has content, add a new empty input
			const isLastInput = index === prev.length - 1;
			if (isLastInput && newValue.trim() !== "") {
				updated.push({ id: generateInputId(), value: "" });
			}

			// Remove empty inputs except for one trailing empty input
			const filtered = updated.filter(
				(item, i) => item.value.trim() !== "" || i === updated.length - 1,
			);

			// Ensure there's always at least one empty input at the end
			const lastItem = filtered[filtered.length - 1];
			if (filtered.length === 0 || (lastItem && lastItem.value.trim() !== "")) {
				filtered.push({ id: generateInputId(), value: "" });
			}

			return filtered;
		});
	}, []);

	return (
		<div className="flex flex-col gap-2">
			{inputs.map((input) => (
				<Input
					key={input.id}
					onChange={(e) => handleChange(input.id, e.target.value)}
					placeholder={placeholder}
					value={input.value}
				/>
			))}
		</div>
	);
}

export function CreateCostUnit({
	...props
}: React.ComponentProps<typeof Button>) {
	const [groups] = api.costUnit.listGroups.useSuspenseQuery();
	const utils = api.useUtils();
	const [open, setOpen] = useState(false);

	const createCostUnit = api.costUnit.create.useMutation({
		onSuccess: () => {
			utils.costUnit.listGroups.invalidate();
			setOpen(false);
			form.reset();
			toast.success("Kostenstellengruppe erfolgreich erstellt");
		},
		onError: (error) => {
			toast.error("Fehler beim Erstellen der Kostenstellengruppe", {
				description: error.message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	const form = useForm({
		defaultValues: {
			tag: "",
			title: "",
			examples: [] as string[],
			costUnitGroupId: "",
		},
		validators: {
			onSubmit: createCostUnitSchema,
		},
		onSubmit: (value) => {
			createCostUnit.mutate(value.value);
		},
	});

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger render={<Button {...props} />} />
			<DialogContent className={"md:max-w-2xl"}>
				<DialogHeader>
					<DialogTitle>Neue Kostenstelle</DialogTitle>
					<DialogDescription>Erstelle eine neue Kostenstelle</DialogDescription>
				</DialogHeader>
				<div>
					<form
						id="form-create-cost-unit"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<FieldGroup className="grid grid-cols-3 gap-4">
							<form.Field name="tag">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Tag</FieldLabel>
											<Input
												aria-invalid={isInvalid}
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="KS 111"
												value={field.state.value}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									);
								}}
							</form.Field>
							<form.Field name="title">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field className="col-span-2" data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Titel</FieldLabel>
											<Input
												aria-invalid={isInvalid}
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="SAW oder SAF"
												value={field.state.value}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									);
								}}
							</form.Field>
							<form.Field name="costUnitGroupId">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field className="col-span-3" data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Gruppe</FieldLabel>
											<NativeSelect
												onChange={(e) => field.handleChange(e.target.value)}
												value={field.state.value}
											>
												<NativeSelectOption value="NONE">Keine Gruppe</NativeSelectOption>
												<NativeSelectOptGroup label="Gruppen">
													{groups.map((group) => (
														<NativeSelectOption key={group.id} value={group.id}>
															{group.title}
														</NativeSelectOption>
													))}
												</NativeSelectOptGroup>
											</NativeSelect>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									);
								}}
							</form.Field>
							<form.Field name="examples">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field className="col-span-3" data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Beispiele</FieldLabel>
											<ExamplesInput
												onChange={field.handleChange}
												placeholder="z.B. Kundenname, Projektbezeichnung"
												value={field.state.value}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									);
								}}
							</form.Field>
							<div className="col-span-3 flex items-center justify-end">
								<Button
									className="w-full"
									disabled={createCostUnit.isPending}
									form="form-create-cost-unit"
									type="submit"
								>
									Erstellen
								</Button>
							</div>
						</FieldGroup>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}

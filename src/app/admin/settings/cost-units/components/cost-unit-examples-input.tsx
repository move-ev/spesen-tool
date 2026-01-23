"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface ExamplesInputProps {
	value: string[];
	onChange: (examples: string[]) => void;
	placeholder?: string;
}

interface InputItem {
	id: string;
	value: string;
}

export function ExamplesInput({
	value,
	onChange,
	placeholder,
}: ExamplesInputProps) {
	const baseId = useId();
	const counterRef = useRef(0);

	const generateInputId = useCallback(() => {
		return `${baseId}-input-${++counterRef.current}`;
	}, [baseId]);

	const [inputs, setInputs] = useState<InputItem[]>(() => [
		{ id: `${baseId}-input-0`, value: "" },
	]);

	// Sync inputs when external value changes (e.g., form reset)
	const valueRef = useRef(value);
	useEffect(() => {
		if (valueRef.current !== value && value.length === 0) {
			setInputs([{ id: generateInputId(), value: "" }]);
		}
		valueRef.current = value;
	}, [value, generateInputId]);

	// Sync non-empty values to parent form (separate effect to avoid setState during render)
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	useEffect(() => {
		const nonEmptyValues = inputs
			.map((item) => item.value)
			.filter((v) => v.trim() !== "");
		onChangeRef.current(nonEmptyValues);
	}, [inputs]);

	const handleChange = useCallback(
		(inputId: string, newValue: string) => {
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
		},
		[generateInputId],
	);

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

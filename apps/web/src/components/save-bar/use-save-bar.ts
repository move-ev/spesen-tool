"use client";

import { type AnyFormApi, useStore } from "@tanstack/react-form";
import { useEffect } from "react";
import { useSaveBarStore } from "./save-bar-store";

/**
 * Registers a TanStack form with the global save bar. The bar appears while
 * any registered form is dirty; Save submits every dirty form independently.
 */
function useSaveBar(id: string, form: AnyFormApi) {
	const isDirty = useStore(form.store, (state) => state.isDirty);
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
	const register = useSaveBarStore((state) => state.register);
	const unregister = useSaveBarStore((state) => state.unregister);

	useEffect(() => {
		register(id, {
			isDirty,
			isSaving: isSubmitting,
			save: () => void form.handleSubmit(),
			discard: () => form.reset(),
		});
	}, [id, isDirty, isSubmitting, form, register]);

	useEffect(() => () => unregister(id), [id, unregister]);
}

export { useSaveBar };

"use client";

import { create } from "zustand";

interface SaveBarEntry {
	isDirty: boolean;
	isSaving: boolean;
	save: () => void;
	discard: () => void;
}

interface SaveBarStore {
	forms: Record<string, SaveBarEntry>;
	register: (id: string, entry: SaveBarEntry) => void;
	unregister: (id: string) => void;
}

const useSaveBarStore = create<SaveBarStore>((set) => ({
	forms: {},
	register: (id, entry) =>
		set((state) => ({ forms: { ...state.forms, [id]: entry } })),
	unregister: (id) =>
		set((state) => {
			const { [id]: _removed, ...forms } = state.forms;
			return { forms };
		}),
}));

export { type SaveBarEntry, useSaveBarStore };

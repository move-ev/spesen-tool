import type { Expense } from "@/generated/prisma/client";

export type ClientExpense = Omit<Expense, "amount"> & {
	amount: number;
};

export type DatePreset = "LAST_7" | "LAST_30" | "LAST_90" | "CUSTOM";

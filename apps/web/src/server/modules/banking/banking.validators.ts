import { z } from "zod";
import { ibanSchema } from "@/lib/validators";

/**
 * The writable fields of a banking record. Create and update accept exactly the
 * same body — update identifies the record through the loader procedure's `id`,
 * not through the payload — so they share one schema rather than two identical
 * copies that could silently drift.
 */
export const bankingDetailsInputSchema = z.object({
	title: z.string().min(1, "Titel ist erforderlich"),
	iban: ibanSchema,
	fullName: z.string().min(1, "Name ist erforderlich"),
});

export const validateIbanSchema = z.object({
	iban: z.string().min(1),
});

/** Shape of the internal banking service's IBAN response. */
export const ibanValidationResultSchema = z.object({
	valid: z.boolean(),
	bic: z.string().nullable(),
});

export type IbanValidationResult = z.infer<typeof ibanValidationResultSchema>;
export type BankingDetailsInput = z.infer<typeof bankingDetailsInputSchema>;

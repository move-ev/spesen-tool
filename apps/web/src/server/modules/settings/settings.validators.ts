import { z } from "zod";

/**
 * `reviewerEmail` accepts "" from the form and stores it as null, so clearing
 * the field is expressible without a separate endpoint.
 */
export const updateSettingsSchema = z.object({
	kilometerRate: z.number().positive().multipleOf(0.01).optional(),
	reviewerEmail: z
		.string()
		.refine(
			(val) => val === "" || z.email().safeParse(val).success,
			"Must be a valid E-Mail",
		)
		.transform((val) => (val === "" ? null : val))
		.nullable()
		.optional(),
	costUnitInfoUrl: z.string().optional().nullable(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

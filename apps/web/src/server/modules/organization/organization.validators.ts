import { z } from "zod";

/**
 * Updating the organization profile. `logo` left undefined means "unchanged";
 * an explicit null clears it. That is what lets one endpoint serve both the
 * name-only form and the full general-settings form.
 */
export const updateOrganizationSchema = z.object({
	name: z.string().min(1).max(100),
	logo: z
		.preprocess(
			(val) => (val === "" ? null : val),
			z.url({ normalize: true }).nullable(),
		)
		.optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

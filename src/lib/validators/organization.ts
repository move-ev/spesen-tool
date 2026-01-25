import z from "zod";

export const createOrganizationSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
});

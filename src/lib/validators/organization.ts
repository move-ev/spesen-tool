import z from "zod";

export const createOrganizationSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
});

export const createInvitationSchema = z.object({
	email: z.email(),
	role: z.enum(["owner", "admin", "member"]),
});

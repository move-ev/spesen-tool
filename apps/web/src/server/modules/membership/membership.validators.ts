import { z } from "zod";

export const membershipListInputSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(50).default(20),
	search: z.string().optional(),
});

export const setMemberRoleSchema = z.object({
	role: z.enum(["admin", "member"]),
});

export type MembershipListInput = z.infer<typeof membershipListInputSchema>;
export type SetMemberRoleInput = z.infer<typeof setMemberRoleSchema>;

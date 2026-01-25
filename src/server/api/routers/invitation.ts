import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { createInvitationSchema } from "@/lib/validators/organization";
import { auth } from "@/server/better-auth";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const invitationRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createInvitationSchema)
		.mutation(async ({ ctx, input }) => {
			console.log({ input, headers: ctx.headers });

			const { success: hasPermission } = await auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					permission: {
						invitation: ["create"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to create invitations",
				});
			}

			const invitation = await auth.api.createInvitation({
				headers: await headers(),
				body: {
					email: input.email,
					role: input.role,
				},
			});

			console.log({ invitation });

			return invitation;
		}),
	listPending: protectedProcedure.query(async ({ ctx }) => {
		const { success: hasPermission } = await auth.api.hasPermission({
			headers: ctx.headers,
			body: {
				permission: {
					invitation: ["cancel"],
				},
			},
		});

		if (!hasPermission) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You don't have permission to list pending invitations",
			});
		}

		return await ctx.db.invitation.findMany({
			where: {
				organizationId: ctx.session.session?.activeOrganizationId ?? undefined,
				status: "pending",
			},
		});
	}),
});

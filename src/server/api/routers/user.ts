import { TRPCError } from "@trpc/server";
import z from "zod";
import { env } from "@/env";
import {
	ADMINS_DEMOTE_OTHER_ADMIN,
	ADMINS_PROMOTE_OTHER_ADMIN,
} from "@/lib/flags";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";
import { auth } from "@/server/better-auth";

export const userRouter = createTRPCRouter({
	// Get current user info
	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: {
				id: true,
				name: true,
				email: true,
				admin: true,
			},
		});
	}),
	promoteToAdmin: adminProcedure
		.input(z.object({ tagetUserId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (ctx.session.user.id === input.tagetUserId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot promote yourself to admin",
				});
			}

			if (
				!ADMINS_PROMOTE_OTHER_ADMIN &&
				ctx.session.user.id !== env.SUPERUSER_ID
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the superuser can promote other admins",
				});
			}

			return await auth.api.setRole({
				headers: ctx.headers,
				body: {
					userId: input.tagetUserId,
					role: "admin",
				},
			});
		}),

	demoteFromAdmin: adminProcedure
		.input(z.object({ tagetUserId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (ctx.session.user.id === input.tagetUserId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot demote yourself from admin",
				});
			}

			const target = await ctx.db.user.findUnique({
				where: { id: input.tagetUserId },
				select: {
					id: true,
					role: true,
				},
			});

			if (!target) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (target.role !== "admin") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User is not an admin",
				});
			}

			if (target.id === env.SUPERUSER_ID) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The superuser cannot be demoted",
				});
			}

			if (!ADMINS_DEMOTE_OTHER_ADMIN && ctx.session.user.id !== env.SUPERUSER_ID) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the superuser can demote other admins",
				});
			}

			return await auth.api.setRole({
				headers: ctx.headers,
				body: {
					userId: input.tagetUserId,
					role: "user",
				},
			});
		}),
});

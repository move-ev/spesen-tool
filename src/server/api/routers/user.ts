import { TRPCError } from "@trpc/server";
import z from "zod";
import { getSuperuserId } from "@/lib/config";
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
		});
	}),
	promoteToAdmin: adminProcedure
		.input(z.object({ targetUserId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (ctx.session.user.id === input.targetUserId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot promote yourself to admin",
				});
			}

			const target = await ctx.db.user.findUnique({
				where: { id: input.targetUserId },
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

			const superuserId = getSuperuserId();

			if (!ADMINS_PROMOTE_OTHER_ADMIN && ctx.session.user.id !== superuserId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the superuser can promote other admins",
				});
			}

			if (target.role === "admin") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User is already an admin",
				});
			}

			return await auth.api.setRole({
				headers: ctx.headers,
				body: {
					userId: input.targetUserId,
					role: "admin",
				},
			});
		}),

	demoteFromAdmin: adminProcedure
		.input(z.object({ targetUserId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (ctx.session.user.id === input.targetUserId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot demote yourself from admin",
				});
			}

			const target = await ctx.db.user.findUnique({
				where: { id: input.targetUserId },
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

			const superuserId = getSuperuserId();

			if (target.role !== "admin") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User is not an admin",
				});
			}

			if (target.id === superuserId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The superuser cannot be demoted",
				});
			}

			if (!ADMINS_DEMOTE_OTHER_ADMIN && ctx.session.user.id !== superuserId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the superuser can demote other admins",
				});
			}

			return await auth.api.setRole({
				headers: ctx.headers,
				body: {
					userId: input.targetUserId,
					role: "user",
				},
			});
		}),
});

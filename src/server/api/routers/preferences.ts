import { TRPCError } from "@trpc/server";
import z from "zod";
import {
	unformattedIbanSchema,
	updatePreferencesServerSchema,
} from "@/lib/validators";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const preferencesRouter = createTRPCRouter({
	getOwn: protectedProcedure.query(async ({ ctx }) => {
		let preferences = await ctx.db.preferences.findUnique({
			where: { userId: ctx.session.user.id },
		});

		if (!preferences) {
			preferences = await ctx.db.preferences.create({
				data: {
					userId: ctx.session.user.id,
					notifications: "ALL",
				},
			});
		}

		return preferences;
	}),
	updateOwn: protectedProcedure
		.input(updatePreferencesServerSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.preferences.update({
				where: { userId: ctx.session.user.id },
				data: {
					notifications: input.notificationPreference,
					iban: input.iban && input.iban.length > 0 ? input.iban : null,
				},
			});
		}),

	updateIban: protectedProcedure
		.input(
			z.object({
				iban: z.union([z.string().length(0), unformattedIbanSchema]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const preferences = await ctx.db.preferences.findUnique({
				where: { userId: ctx.session.user.id },
				select: {
					userId: true,
				},
			});

			if (!preferences) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Preferences not found",
				});
			}

			return await ctx.db.preferences.update({
				where: { userId: ctx.session.user.id },
				data: {
					// Convert empty IBAN to null for consistency with updateOwn
					iban: input.iban && input.iban.length > 0 ? input.iban : null,
				},
			});
		}),
});

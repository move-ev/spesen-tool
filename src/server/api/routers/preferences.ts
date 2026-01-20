import { updatePreferencesSchema } from "@/lib/validators";
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
					notificationPreference: "ALL",
				},
			});
		}

		return preferences;
	}),
	updateOwn: protectedProcedure
		.input(updatePreferencesSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.preferences.update({
				where: { userId: ctx.session.user.id },
				data: {
					notificationPreference: input.notificationPreference,
				},
			});
		}),
});

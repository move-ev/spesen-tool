import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	updateMealAllowancesSchema,
	updateTravelAllowancesSchema,
} from "@/lib/validators";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";

export const settingsRouter = createTRPCRouter({
	// Get settings (only admins)
	get: protectedProcedure.query(async ({ ctx }) => {
		const isAdmin = ctx.session.user.role === "admin";

		if (!isAdmin) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Only admins can access settings",
			});
		}

		let settings = await ctx.db.settings.findUnique({
			where: { id: "singleton" },
		});

		// Create default settings if they don't exist
		if (!settings) {
			settings = await ctx.db.settings.create({
				data: {
					id: "singleton",
					kilometerRate: 0.3,
				},
			});
		}

		return {
			...settings,
			kilometerRate: Number(settings.kilometerRate),
			dailyFoodAllowance: Number(settings.dailyFoodAllowance),
			breakfastDeduction: Number(settings.breakfastDeduction),
			lunchDeduction: Number(settings.lunchDeduction),
			dinnerDeduction: Number(settings.dinnerDeduction),
		};
	}),

	// Public settings for non-admin usage
	getPublic: publicProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.settings.findUnique({
			where: { id: "singleton" },
			select: {
				costUnitInfoUrl: true,
			},
		});

		return {
			costUnitInfoUrl: settings?.costUnitInfoUrl ?? null,
		};
	}),

	// Update settings (only admins)
	update: protectedProcedure
		.input(
			z.object({
				kilometerRate: z.number().positive().optional(),
				reviewerEmail: z.email().optional().nullable(),
				costUnitInfoUrl: z.string().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user is admin
			const isAdmin = ctx.session.user.role === "admin";
			if (!isAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only admins can update settings",
				});
			}

			// Ensure settings exist
			let settings = await ctx.db.settings.findUnique({
				where: { id: "singleton" },
			});

			if (!settings) {
				settings = await ctx.db.settings.create({
					data: {
						id: "singleton",
						kilometerRate: input.kilometerRate ?? 0.3,
						reviewerEmail: input.reviewerEmail ?? null,
					},
				});
			} else {
				settings = await ctx.db.settings.update({
					where: { id: "singleton" },
					data: input,
				});
			}

			return settings;
		}),
	listUsers: adminProcedure.query(async ({ ctx }) => {
		return await ctx.db.user.findMany({});
	}),
	updateMealAllowances: adminProcedure
		.input(updateMealAllowancesSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.settings.update({
				where: { id: "singleton" },
				data: input,
			});
		}),
	updateTravelAllowances: adminProcedure
		.input(updateTravelAllowancesSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.settings.update({
				where: { id: "singleton" },
				data: input,
			});
		}),
});

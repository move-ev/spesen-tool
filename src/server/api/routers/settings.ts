import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";

export const settingsRouter = createTRPCRouter({
	// Get settings (only admins)
	get: protectedProcedure.query(async ({ ctx }) => {
		// Check if user is admin
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: { admin: true },
		});

		if (user?.admin !== true) {
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

		return settings;
	}),

	// Public settings for non-admin usage
	getPublic: publicProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.settings.findUnique({
			where: { id: "singleton" },
			select: {
				accountingUnitPdfUrl: true,
			},
		});

		return {
			accountingUnitPdfUrl: settings?.accountingUnitPdfUrl ?? null,
		};
	}),

	// Update settings (only admins)
	update: protectedProcedure
		.input(
			z.object({
				kilometerRate: z.number().positive().optional(),
				reviewerEmail: z.string().email().optional().nullable(),
				accountingUnitPdfUrl: z.string().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
		// Check if user is admin
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: { admin: true },
		});

		if (user?.admin !== true) {
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
});

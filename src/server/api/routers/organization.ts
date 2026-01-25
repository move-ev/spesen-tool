import { TRPCError } from "@trpc/server";
import { createOrganizationSchema } from "@/lib/validators/organization";
import { auth } from "@/server/better-auth";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const organizationRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createOrganizationSchema)
		.mutation(async ({ ctx, input }) => {
			const { status: slugAvailable } = await auth.api.checkOrganizationSlug({
				body: { slug: input.slug },
				headers: ctx.headers,
			});

			if (!slugAvailable) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Slug already exists",
				});
			}

			const organization = await auth.api.createOrganization({
				body: {
					...input,
				},
				// This will make the current user the owner of the organization
				headers: ctx.headers,
			});

			if (!organization) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create organization",
				});
			}

			return organization;
		}),
});

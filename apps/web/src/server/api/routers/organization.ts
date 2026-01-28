import { TRPCError } from "@trpc/server";
import z from "zod";
import { getDomainFromEmail } from "@/lib/utils/organization";
import {
	createOrganizationSchema,
	updateOrganizationSchema,
} from "@/lib/validators/organization";
import { auth } from "@/server/better-auth";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const organizationRouter = createTRPCRouter({
	listOwn: protectedProcedure.query(async ({ ctx }) => {
		return await auth.api.listOrganizations({
			headers: ctx.headers,
		});
	}),

	get: protectedProcedure
		.input(z.object({ organizationId: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db.organization.findUnique({
				where: {
					id:
						input.organizationId ??
						ctx.session.session.activeOrganizationId ??
						undefined,
				},
			});
		}),

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

	update: protectedProcedure
		.input(updateOrganizationSchema)
		.mutation(async ({ ctx, input }) => {
			const { success: hasPermission } = await auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					organizationId: ctx.session.session.activeOrganizationId ?? undefined,
					permission: {
						organization: ["update"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to update the organization",
				});
			}

			return await auth.api.updateOrganization({
				headers: ctx.headers,
				body: {
					data: {
						name: input.name,
					},
				},
			});
		}),

	listMembers: protectedProcedure
		.input(z.object({ organizationId: z.string().optional() }))
		.query(async ({ input, ctx }) => {
			const hasPermission = await auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					organizationId: "sdfsdf",
					permission: {
						member: ["list"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to list members",
				});
			}

			if (!ctx.session.session.activeOrganizationId && !input.organizationId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Either you must be in an organization or provide an organizationId to list members.",
				});
			}

			let orgId = ctx.session.session.activeOrganizationId;

			if (input.organizationId) {
				orgId = input.organizationId;
			}

			return await auth.api.listMembers({
				headers: ctx.headers,
				query: {
					organizationId: orgId ?? undefined,
					limit: 100,
				},
			});
		}),

	getForDomain: protectedProcedure
		.input(z.object({ domain: z.string() }))
		.query(async ({ ctx, input }) => {
			const organizationDomain = await ctx.db.organizationDomain.findUnique({
				where: {
					domain: input.domain,
				},
				include: {
					organization: true,
				},
			});

			if (!organizationDomain) {
				return null;
			}

			return organizationDomain.organization;
		}),

	/**
	 * Lets a user joib a suggested organization when possible.
	 *
	 * Searches for an organization by domain. If found, the user is added as
	 * a member.
	 */
	joinSuggestedOrganization: protectedProcedure.mutation(async ({ ctx }) => {
		const emailParseResult = z.email().safeParse(ctx.session.user.email);

		if (!emailParseResult.success) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid email",
			});
		}

		const emailDomain = getDomainFromEmail(emailParseResult.data);

		if (!emailDomain) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid email domain",
			});
		}

		const organizationDomain = await ctx.db.organizationDomain.findUnique({
			where: {
				domain: emailDomain,
			},
		});

		if (!organizationDomain) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "No organization found for this domain",
			});
		}

		const res = await auth.api.addMember({
			headers: ctx.headers,
			body: {
				role: "member",
				userId: ctx.session.user.id,
				organizationId: organizationDomain.organizationId,
			},
		});

		if (!res) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to add member to organization",
			});
		}

		return res;
	}),
});

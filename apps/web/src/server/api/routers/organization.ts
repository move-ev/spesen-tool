import { TRPCError } from "@trpc/server";
import z from "zod";
import { getDomainFromEmail } from "@/lib/utils/organization";
import {
	createOrganizationSchema,
	updateOrganizationSchema,
} from "@/lib/validators/organization";
import { auth } from "@/server/better-auth";
import { listUsersUnified } from "@/server/services/organization.service";
import {
	getAmountRequestedStats,
	getReportsCreatedStats,
	Period,
} from "@/server/services/stats.service";
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

			if (!orgId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No organization ID provided",
				});
			}

			const hasPermission = await auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					organizationId: orgId,
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

			return await ctx.db.member.findMany({
				where: {
					organizationId: orgId,
				},
				include: {
					user: true,
				},
			});
		}),

	listInvitations: protectedProcedure
		.input(z.object({ organizationId: z.string().optional() }))
		.query(async ({ input, ctx }) => {
			if (!ctx.session.session.activeOrganizationId && !input.organizationId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Either you must be in an organization or provide an organizationId to list invitations.",
				});
			}

			let orgId = ctx.session.session.activeOrganizationId;

			if (input.organizationId) {
				orgId = input.organizationId;
			}

			if (!orgId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No organization ID provided",
				});
			}

			const hasPermission = await auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					organizationId: orgId,
					permission: {
						member: ["list"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to list invitations",
				});
			}

			return await ctx.db.invitation.findMany({
				where: {
					organizationId: orgId,
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

	/**
	 * Unified endpoint returning both members and invitations with page-based pagination.
	 *
	 * Uses database-level offset pagination for predictable page navigation.
	 * Delegates business logic to the organization service layer.
	 *
	 * @see {@link listUsersUnified} for pagination implementation details
	 */
	listUsersUnified: protectedProcedure
		.input(
			z.object({
				organizationId: z.string().optional(),
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(20),
				emailFilter: z.string().optional(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { page, pageSize, emailFilter } = input;

			// Determine organization ID
			const orgId =
				input.organizationId ?? ctx.session.session.activeOrganizationId;

			if (!orgId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Either you must be in an organization or provide an organizationId",
				});
			}

			// Permission check
			const { success: hasPermission } = await auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					organizationId: orgId,
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

			// Delegate to service layer for business logic and pagination
			return await listUsersUnified(ctx.db, {
				organizationId: orgId,
				page,
				pageSize,
				emailFilter,
			});
		}),

	getStats: protectedProcedure
		.input(
			z.object({
				organizationId: z.string().optional(),
				period: z.nativeEnum(Period),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { period } = input;

			// Determine organization ID
			const orgId =
				input.organizationId ?? ctx.session.session.activeOrganizationId;

			if (!orgId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Either you must be in an organization or provide an organizationId",
				});
			}

			// Permission check
			const { success: hasPermission } = await auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					organizationId: orgId,
					permission: {
						stats: ["read"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to read stats",
				});
			}

			const [reportsCreatedStats, amountRequestedStats] = await Promise.all([
				getReportsCreatedStats(ctx.db, {
					organizationId: orgId,
					period,
				}),
				getAmountRequestedStats(ctx.db, {
					organizationId: orgId,
					period,
				}),
			]);

			// Delegate to service layer for business logic and pagination
			return {
				reportsCreated: reportsCreatedStats,
				amountRequested: amountRequestedStats,
			};
		}),
});

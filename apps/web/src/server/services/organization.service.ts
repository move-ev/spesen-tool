/**
 * Organization Service Layer
 *
 * Handles business logic for organization members and invitations.
 * Separates data transformation, validation, and query building from API routes.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import type { UnifiedUserRow } from "@/lib/types/organization";

/**
 * Valid invitation statuses from the database
 */
const VALID_INVITATION_STATUSES = ["pending", "accepted", "expired"] as const;
type _InvitationStatus = (typeof VALID_INVITATION_STATUSES)[number];

/**
 * Validates and normalizes invitation status
 */
function normalizeInvitationStatus(
	status: string,
	expiresAt: Date,
): "pending" | "expired" {
	const now = new Date();
	const isExpired = expiresAt < now;

	if (isExpired) {
		return "expired";
	}

	// Validate status is one we expect, default to pending if unknown
	if (status === "pending" || status === "accepted") {
		return "pending";
	}

	return "pending";
}

/**
 * Builds the email filter condition for Prisma queries
 */
function buildEmailFilterCondition(emailFilter?: string) {
	if (!emailFilter) return undefined;

	return {
		contains: emailFilter,
		mode: "insensitive" as const,
	};
}

/**
 * Builds the where clause for member queries
 */
export function buildMemberWhereClause(
	organizationId: string,
	emailFilter?: string,
) {
	const emailCondition = buildEmailFilterCondition(emailFilter);

	return {
		organizationId,
		...(emailCondition ? { user: { email: emailCondition } } : {}),
	};
}

/**
 * Builds the where clause for invitation queries
 */
export function buildInvitationWhereClause(
	organizationId: string,
	emailFilter?: string,
) {
	const emailCondition = buildEmailFilterCondition(emailFilter);

	return {
		organizationId,
		...(emailCondition ? { email: emailCondition } : {}),
	};
}

/**
 * Transforms a database member to a UnifiedUserRow
 */
export function transformMemberToUnifiedRow(member: {
	id: string;
	role: string;
	createdAt: Date;
	userId: string;
	user: {
		id: string;
		email: string;
		name: string;
		image: string | null;
	};
}): UnifiedUserRow {
	return {
		id: member.id,
		type: "member",
		email: member.user.email,
		name: member.user.name,
		image: member.user.image,
		role: member.role,
		status: "active",
		joinedAt: member.createdAt,
		createdAt: member.createdAt,
		userId: member.userId,
	};
}

/**
 * Transforms a database invitation to a UnifiedUserRow
 */
export function transformInvitationToUnifiedRow(invitation: {
	id: string;
	email: string;
	role: string | null;
	status: string;
	expiresAt: Date;
	createdAt: Date;
}): UnifiedUserRow {
	return {
		id: invitation.id,
		type: "invitation",
		email: invitation.email,
		name: null,
		image: null,
		role: invitation.role ?? "member",
		status: normalizeInvitationStatus(invitation.status, invitation.expiresAt),
		joinedAt: invitation.createdAt,
		createdAt: invitation.createdAt,
		expiresAt: invitation.expiresAt,
	};
}

/**
 * Service options for listing unified users with page-based pagination
 */
export interface ListUsersUnifiedOptions {
	organizationId: string;
	page: number; // 1-indexed page number
	pageSize: number; // Items per page
	emailFilter?: string;
}

/**
 * Result of listing unified users with pagination metadata
 */
export interface ListUsersUnifiedResult {
	items: UnifiedUserRow[];
	pagination: {
		page: number; // Current page (1-indexed)
		pageSize: number; // Items per page
		totalCount: number; // Total items across all pages
		totalPages: number; // Total number of pages
		hasNextPage: boolean; // Whether there's a next page
		hasPreviousPage: boolean; // Whether there's a previous page
	};
	counts: {
		members: number; // Total member count (with filter applied)
		invitations: number; // Total invitation count (with filter applied)
	};
}

/**
 * Lists members and invitations with page-based server-side pagination.
 *
 * This implementation uses database-level offset pagination with proper
 * handling of the unified members + invitations list.
 *
 * Strategy:
 * 1. Fetch total counts for both members and invitations
 * 2. Calculate which items fall on the current page
 * 3. Members always appear first (sorted by createdAt DESC)
 * 4. Invitations appear after all members (sorted by createdAt DESC)
 * 5. Fetch only the items needed for the current page
 *
 * Example with 50 members, 30 invitations, pageSize=20:
 * - Page 1: Members 1-20
 * - Page 2: Members 21-40
 * - Page 3: Members 41-50, Invitations 1-10
 * - Page 4: Invitations 11-30
 *
 * @param db - Prisma client instance
 * @param options - Query options including page number, page size, and filters
 * @returns Paginated unified users with full pagination metadata
 */
export async function listUsersUnified(
	db: PrismaClient,
	options: ListUsersUnifiedOptions,
): Promise<ListUsersUnifiedResult> {
	const { organizationId, page, pageSize, emailFilter } = options;

	// Validate page number
	if (page < 1) {
		throw new Error("Page number must be >= 1");
	}

	// Build where clauses
	const memberWhere = buildMemberWhereClause(organizationId, emailFilter);
	const invitationWhere = buildInvitationWhereClause(
		organizationId,
		emailFilter,
	);

	// Fetch total counts in parallel
	const [totalMemberCount, totalInvitationCount] = await db.$transaction([
		db.member.count({ where: memberWhere }),
		db.invitation.count({ where: invitationWhere }),
	]);

	const totalCount = totalMemberCount + totalInvitationCount;
	const totalPages = Math.ceil(totalCount / pageSize);

	// Calculate pagination offsets
	// Global offset in the combined list
	const globalOffset = (page - 1) * pageSize;
	const _globalEnd = globalOffset + pageSize;

	const items: UnifiedUserRow[] = [];

	// Determine which data to fetch based on offset
	if (globalOffset < totalMemberCount) {
		// Page includes members
		const memberOffset = globalOffset;
		const memberLimit = Math.min(pageSize, totalMemberCount - memberOffset);

		const members = await db.member.findMany({
			where: memberWhere,
			skip: memberOffset,
			take: memberLimit,
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
						image: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Transform and add members
		const transformedMembers = members.map(transformMemberToUnifiedRow);
		items.push(...transformedMembers);

		// If we haven't filled the page, fetch invitations
		const remainingSlots = pageSize - items.length;
		if (remainingSlots > 0 && totalInvitationCount > 0) {
			const invitations = await db.invitation.findMany({
				where: invitationWhere,
				skip: 0, // Start from first invitation
				take: remainingSlots,
				orderBy: {
					createdAt: "desc",
				},
			});

			const transformedInvitations = invitations.map(
				transformInvitationToUnifiedRow,
			);
			items.push(...transformedInvitations);
		}
	} else {
		// Page only includes invitations
		const invitationOffset = globalOffset - totalMemberCount;
		const invitationLimit = Math.min(
			pageSize,
			totalInvitationCount - invitationOffset,
		);

		const invitations = await db.invitation.findMany({
			where: invitationWhere,
			skip: invitationOffset,
			take: invitationLimit,
			orderBy: {
				createdAt: "desc",
			},
		});

		const transformedInvitations = invitations.map(
			transformInvitationToUnifiedRow,
		);
		items.push(...transformedInvitations);
	}

	return {
		items,
		pagination: {
			page,
			pageSize,
			totalCount,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
		},
		counts: {
			members: totalMemberCount,
			invitations: totalInvitationCount,
		},
	};
}

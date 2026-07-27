import type { Prisma, PrismaClient } from "@zemio/db";

type Db = PrismaClient;

const organizationSelect = {
	id: true,
	name: true,
	slug: true,
	logo: true,
	metadata: true,
	microsoftTenantId: true,
	createdAt: true,
} satisfies Prisma.OrganizationSelect;

export type OrganizationRow = Prisma.OrganizationGetPayload<{
	select: typeof organizationSelect;
}>;

/** Platform-admin detail view: the org plus its settings, members and invites. */
const organizationDetailSelect = {
	id: true,
	name: true,
	slug: true,
	logo: true,
	metadata: true,
	microsoftTenantId: true,
	createdAt: true,
	settings: {
		select: {
			id: true,
			reviewerEmail: true,
			kilometerRate: true,
			costUnitInfoUrl: true,
			dailyFoodAllowance: true,
			breakfastDeduction: true,
			lunchDeduction: true,
			dinnerDeduction: true,
			updatedAt: true,
		},
	},
	members: {
		orderBy: [{ role: "asc" }, { createdAt: "asc" }],
		select: {
			id: true,
			role: true,
			createdAt: true,
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					role: true,
					microsoftTenantId: true,
				},
			},
		},
	},
	invitations: {
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			email: true,
			role: true,
			status: true,
			expiresAt: true,
			createdAt: true,
			inviter: { select: { id: true, name: true, email: true } },
		},
	},
	_count: {
		select: {
			members: true,
			invitations: true,
			reports: true,
			costUnits: true,
			costUnitGroups: true,
		},
	},
} satisfies Prisma.OrganizationSelect;

const organizationSummarySelect = {
	id: true,
	name: true,
	slug: true,
	microsoftTenantId: true,
	createdAt: true,
	_count: { select: { members: true } },
} satisfies Prisma.OrganizationSelect;

export type OrganizationDetail = Prisma.OrganizationGetPayload<{
	select: typeof organizationDetailSelect;
}>;

export type OrganizationSummary = Prisma.OrganizationGetPayload<{
	select: typeof organizationSummarySelect;
}>;

export const organizationRepository = {
	findById(db: Db, id: string): Promise<OrganizationRow | null> {
		return db.organization.findUnique({
			where: { id },
			select: organizationSelect,
		});
	},

	/** Platform scope: every organization, no tenant filter. */
	listAll(db: Db): Promise<OrganizationSummary[]> {
		return db.organization.findMany({
			orderBy: { createdAt: "asc" },
			select: organizationSummarySelect,
		});
	},

	findDetailById(db: Db, id: string): Promise<OrganizationDetail | null> {
		return db.organization.findUnique({
			where: { id },
			select: organizationDetailSelect,
		});
	},

	/** Returns the id of a different org already holding `slug`, if any. */
	findConflictingSlug(
		db: Db,
		args: { slug: string; excludeId?: string },
	): Promise<{ id: string } | null> {
		return db.organization.findFirst({
			where: {
				slug: args.slug,
				...(args.excludeId ? { NOT: { id: args.excludeId } } : {}),
			},
			select: { id: true },
		});
	},

	create(
		db: Db,
		args: { name: string; slug: string; microsoftTenantId: string },
	): Promise<OrganizationRow> {
		return db.organization.create({
			data: {
				id: crypto.randomUUID(),
				name: args.name,
				slug: args.slug,
				microsoftTenantId: args.microsoftTenantId,
				createdAt: new Date(),
			},
			select: organizationSelect,
		});
	},

	update(
		db: Db,
		args: { id: string; data: Prisma.OrganizationUpdateInput },
	): Promise<OrganizationRow> {
		return db.organization.update({
			where: { id: args.id },
			data: args.data,
			select: organizationSelect,
		});
	},
} as const;

export type OrganizationRepository = typeof organizationRepository;

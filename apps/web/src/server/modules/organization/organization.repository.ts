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

export const organizationRepository = {
	findById(db: Db, id: string): Promise<OrganizationRow | null> {
		return db.organization.findUnique({
			where: { id },
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

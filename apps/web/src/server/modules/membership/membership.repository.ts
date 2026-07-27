import type { Prisma, PrismaClient } from "@zemio/db";

type Db = PrismaClient;

const memberUserSelect = {
	id: true,
	name: true,
	email: true,
	image: true,
} satisfies Prisma.UserSelect;

const membershipSelect = {
	id: true,
	role: true,
	createdAt: true,
	organizationId: true,
	user: { select: memberUserSelect },
} satisfies Prisma.MemberSelect;

export type MembershipRow = Prisma.MemberGetPayload<{
	select: typeof membershipSelect;
}>;

export const membershipRepository = {
	findById(
		db: Db,
		args: { id: string; organizationId: string },
	): Promise<MembershipRow | null> {
		return db.member.findFirst({
			where: { id: args.id, organizationId: args.organizationId },
			select: membershipSelect,
		});
	},

	listPage(
		db: Db,
		args: { where: Prisma.MemberWhereInput; skip: number; take: number },
	): Promise<MembershipRow[]> {
		return db.member.findMany({
			where: args.where,
			skip: args.skip,
			take: args.take,
			orderBy: { createdAt: "asc" },
			select: membershipSelect,
		});
	},

	count(db: Db, where: Prisma.MemberWhereInput): Promise<number> {
		return db.member.count({ where });
	},
} as const;

export type MembershipRepository = typeof membershipRepository;

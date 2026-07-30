import type {
	CostUnitGroup,
	CostUnitStatus,
	Prisma,
	PrismaClient,
} from "@zemio/db";

type Db = PrismaClient;

/** Detail projection for the update form: form fields plus the delete guard. */
const costUnitDetailSelect = {
	id: true,
	tag: true,
	title: true,
	examples: true,
	color: true,
	status: true,
	costUnitGroupId: true,
	createdAt: true,
	costUnitGroup: { select: { id: true, title: true } },
	_count: { select: { reports: true } },
} satisfies Prisma.CostUnitSelect;

/** Row projection for the paginated admin table. */
const costUnitRowSelect = {
	id: true,
	tag: true,
	title: true,
	examples: true,
	color: true,
	costUnitGroupId: true,
	createdAt: true,
	status: true,
	costUnitGroup: { select: { title: true } },
} satisfies Prisma.CostUnitSelect;

/** Minimal projection for pickers — only what a selectable option renders. */
const costUnitOptionSelect = {
	id: true,
	title: true,
	tag: true,
	examples: true,
	color: true,
} satisfies Prisma.CostUnitSelect;

export type CostUnitDetail = Prisma.CostUnitGetPayload<{
	select: typeof costUnitDetailSelect;
}>;

export type CostUnitRow = Prisma.CostUnitGetPayload<{
	select: typeof costUnitRowSelect;
}>;

export type CostUnitOption = Prisma.CostUnitGetPayload<{
	select: typeof costUnitOptionSelect;
}>;

export type CostUnitGroupRow = CostUnitGroup;

type CostUnitWriteData = {
	tag: string;
	title: string;
	examples: string[];
	color: Prisma.CostUnitCreateInput["color"];
	costUnitGroupId: string | null;
};

export const costUnitRepository = {
	findById(
		db: Db,
		args: { id: string; organizationId: string },
	): Promise<CostUnitDetail | null> {
		return db.costUnit.findFirst({
			where: { id: args.id, organizationId: args.organizationId },
			select: costUnitDetailSelect,
		});
	},

	listPage(
		db: Db,
		args: {
			where: Prisma.CostUnitWhereInput;
			orderBy: Prisma.CostUnitOrderByWithRelationInput[];
			skip: number;
			take: number;
		},
	): Promise<CostUnitRow[]> {
		return db.costUnit.findMany({
			where: args.where,
			skip: args.skip,
			take: args.take,
			orderBy: args.orderBy,
			select: costUnitRowSelect,
		});
	},

	count(db: Db, where: Prisma.CostUnitWhereInput): Promise<number> {
		return db.costUnit.count({ where });
	},

	/**
	 * Groups with their selectable (non-archived) cost units. The status filter
	 * sits on the nested relation so a group is never hidden just because one of
	 * its units is archived.
	 */
	listGroupsWithOptions(db: Db, organizationId: string) {
		return db.costUnitGroup.findMany({
			where: { organizationId },
			select: {
				id: true,
				title: true,
				costUnits: {
					where: { status: { not: "ARCHIVED" } },
					select: costUnitOptionSelect,
					orderBy: { tag: "asc" },
				},
			},
			orderBy: { title: "asc" },
		});
	},

	listUngroupedOptions(
		db: Db,
		organizationId: string,
	): Promise<CostUnitOption[]> {
		return db.costUnit.findMany({
			where: {
				organizationId,
				costUnitGroupId: null,
				status: { not: "ARCHIVED" },
			},
			select: costUnitOptionSelect,
			orderBy: { tag: "asc" },
		});
	},

	listGroups(db: Db, organizationId: string): Promise<CostUnitGroupRow[]> {
		return db.costUnitGroup.findMany({
			where: { organizationId },
			orderBy: { title: "asc" },
		});
	},

	findGroupById(
		db: Db,
		args: { id: string; organizationId: string },
	): Promise<{ id: string } | null> {
		return db.costUnitGroup.findFirst({
			where: { id: args.id, organizationId: args.organizationId },
			select: { id: true },
		});
	},

	create(
		db: Db,
		args: { organizationId: string; data: CostUnitWriteData },
	): Promise<CostUnitRow> {
		return db.costUnit.create({
			data: { ...args.data, organizationId: args.organizationId },
			select: costUnitRowSelect,
		});
	},

	update(
		db: Db,
		args: { id: string; data: CostUnitWriteData & { status: CostUnitStatus } },
	): Promise<CostUnitRow> {
		return db.costUnit.update({
			where: { id: args.id },
			data: args.data,
			select: costUnitRowSelect,
		});
	},

	remove(db: Db, id: string): Promise<CostUnitRow> {
		return db.costUnit.delete({ where: { id }, select: costUnitRowSelect });
	},

	createGroup(
		db: Db,
		args: { organizationId: string; title: string },
	): Promise<CostUnitGroupRow> {
		return db.costUnitGroup.create({
			data: { title: args.title, organizationId: args.organizationId },
		});
	},

	updateGroup(
		db: Db,
		args: { id: string; title: string },
	): Promise<CostUnitGroupRow> {
		return db.costUnitGroup.update({
			where: { id: args.id },
			data: { title: args.title },
		});
	},

	removeGroup(db: Db, id: string): Promise<CostUnitGroupRow> {
		return db.costUnitGroup.delete({ where: { id } });
	},
} as const;

export type CostUnitRepository = typeof costUnitRepository;

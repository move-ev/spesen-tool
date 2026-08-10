import { TRPCError } from "@trpc/server";
import type { CostUnitStatus, Prisma, PrismaClient } from "@zemio/db";
import { type CostUnitSortField, NO_COST_UNIT_GROUP } from "@/lib/consts";
import {
	isUniqueConstraintError,
	mapPrismaError,
} from "@/server/shared/errors";
import {
	offsetPageArgs,
	type PageMeta,
	toPageMeta,
} from "@/server/shared/pagination";
import {
	type CostUnitSelectionGroupDTO,
	toCostUnitSelectionDTO,
} from "./cost-unit.dto";
import {
	type CostUnitDetail,
	type CostUnitGroupRow,
	type CostUnitRepository,
	type CostUnitRow,
	costUnitRepository,
} from "./cost-unit.repository";
import type {
	CostUnitListFilterRule,
	CostUnitListInput,
	CostUnitListSorting,
} from "./cost-unit.validators";

export type CostUnitServiceContext = {
	db: PrismaClient;
	organizationId: string;
	userId: string;
};

type CostUnitWriteInput = {
	tag: string;
	title: string;
	examples: string[];
	color: Prisma.CostUnitCreateInput["color"];
	costUnitGroupId: string;
};

type PaginatedCostUnits = {
	costUnits: CostUnitRow[];
	pagination: PageMeta;
};

/**
 * The picker submits `""` or the synthetic "no group" id to mean "ungrouped";
 * both normalize to a null foreign key.
 */
function toCostUnitGroupId(raw: string): string | null {
	if (raw.length === 0 || raw === NO_COST_UNIT_GROUP) {
		return null;
	}
	return raw;
}

function buildSearchWhere(search: string): Prisma.CostUnitWhereInput {
	return {
		OR: [
			{ title: { contains: search, mode: "insensitive" } },
			{ tag: { contains: search, mode: "insensitive" } },
		],
	};
}

/**
 * A predicate no row can satisfy. Used as the fail-closed result when a filter
 * compiles to nothing: an empty `where` would match the entire table, silently
 * turning a filter the user can still see into a no-op.
 */
const MATCHES_NOTHING: Prisma.CostUnitWhereInput = { id: { in: [] } };

function combineWhere(
	logic: "OR" | "AND",
	branches: Prisma.CostUnitWhereInput[],
): Prisma.CostUnitWhereInput {
	const [only] = branches;
	if (only === undefined) {
		return MATCHES_NOTHING;
	}
	return branches.length === 1 ? only : { [logic]: branches };
}

/**
 * Compiles a group filter. The picker's synthetic "no group" id stands for a
 * null foreign key, so both operators have to branch on it explicitly.
 *
 * The negative case is deliberately not expressed as `NOT { in }`: SQL's
 * `col NOT IN (…)` is unknown for a null `col`, which would silently drop every
 * ungrouped row from an "is not <group>" result even though it belongs there.
 */
function buildGroupWhere(
	ids: string[],
	op: "in" | "notIn",
): Prisma.CostUnitWhereInput {
	const groupIds = ids.filter((id) => id !== NO_COST_UNIT_GROUP);
	const coversUngrouped = ids.length !== groupIds.length;

	if (op === "in") {
		const branches: Prisma.CostUnitWhereInput[] = [];
		if (groupIds.length > 0) {
			branches.push({ costUnitGroupId: { in: groupIds } });
		}
		if (coversUngrouped) {
			branches.push({ costUnitGroupId: null });
		}
		return combineWhere("OR", branches);
	}

	const branches: Prisma.CostUnitWhereInput[] = [];
	if (groupIds.length > 0) {
		branches.push({
			OR: [{ costUnitGroupId: { notIn: groupIds } }, { costUnitGroupId: null }],
		});
	}
	if (coversUngrouped) {
		branches.push({ costUnitGroupId: { not: null } });
	}
	return combineWhere("AND", branches);
}

function compileFilterRule(
	rule: CostUnitListFilterRule,
): Prisma.CostUnitWhereInput {
	switch (rule.field) {
		case "status":
			return rule.op === "in"
				? { status: { in: rule.value } }
				: { status: { notIn: rule.value } };
		case "costUnitGroupId":
			return buildGroupWhere(rule.value, rule.op);
	}
}

function buildListWhere(
	organizationId: string,
	input: CostUnitListInput,
): Prisma.CostUnitWhereInput {
	const and: Prisma.CostUnitWhereInput[] = [];

	if (input.search) {
		and.push(buildSearchWhere(input.search));
	}
	for (const rule of input.filters ?? []) {
		and.push(compileFilterRule(rule));
	}

	return and.length > 0 ? { organizationId, AND: and } : { organizationId };
}

/**
 * Maps each sortable column to its Prisma ordering. Spelled out as a `Record`
 * rather than a computed key (`{ [sort.id]: direction }`): TypeScript widens a
 * computed key to an index signature and stops checking it against the model,
 * so a column the schema can't actually order by would compile and fail at
 * runtime. This form makes adding a field to `COST_UNIT_SORT_FIELDS` a compile
 * error until it is mapped here.
 */
const ORDER_BY_FIELD: Record<
	CostUnitSortField,
	(direction: Prisma.SortOrder) => Prisma.CostUnitOrderByWithRelationInput
> = {
	tag: (direction) => ({ tag: direction }),
	title: (direction) => ({ title: direction }),
	status: (direction) => ({ status: direction }),
	group: (direction) => ({ costUnitGroup: { title: direction } }),
	createdAt: (direction) => ({ createdAt: direction }),
};

const DEFAULT_ORDER_BY: Prisma.CostUnitOrderByWithRelationInput[] = [
	{ tag: "asc" },
];

/**
 * Offset pagination needs a total order: without a unique tiebreaker, rows that
 * tie on the sort column can repeat or vanish between pages. `tag` is unique
 * per organization, so appending it makes every ordering deterministic.
 */
function buildListOrderBy(
	sorting: CostUnitListSorting,
): Prisma.CostUnitOrderByWithRelationInput[] {
	const sort = sorting?.[0];

	if (!sort) {
		return DEFAULT_ORDER_BY;
	}

	const direction: Prisma.SortOrder = sort.desc ? "desc" : "asc";
	const primary = ORDER_BY_FIELD[sort.id](direction);

	return sort.id === "tag" ? [primary] : [primary, { tag: "asc" }];
}

/**
 * Assembles one page of a group-sorted list, keeping ungrouped rows in their own
 * bucket after every named group.
 *
 * A row without a group renders as a translated "no group" label, which the
 * database cannot order alphabetically. Left to Postgres, the NULL titles also
 * swap ends with the direction (last ascending, first descending), so the
 * ungrouped rows appeared to jump around rather than behave like one bucket.
 *
 * Prisma cannot express `NULLS LAST` on a relation ordering — the generated
 * `CostUnitGroupOrderByWithRelationInput.title` is a bare `SortOrder` — so the
 * page is stitched from two ordered queries over the *same* `where` instead of
 * from raw SQL, which would mean restating the filter logic and letting it
 * drift.
 */
async function listUngroupedLastPage(
	deps: { repo: CostUnitRepository; db: PrismaClient },
	args: {
		where: Prisma.CostUnitWhereInput;
		direction: Prisma.SortOrder;
		skip: number;
		take: number;
	},
): Promise<CostUnitRow[]> {
	const { repo, db } = deps;
	const { where, direction, skip, take } = args;

	const grouped: Prisma.CostUnitWhereInput = {
		AND: [where, { costUnitGroupId: { not: null } }],
	};
	const ungrouped: Prisma.CostUnitWhereInput = {
		AND: [where, { costUnitGroupId: null }],
	};

	const groupedCount = await repo.count(db, grouped);

	const rows =
		skip < groupedCount
			? await repo.listPage(db, {
					where: grouped,
					orderBy: [ORDER_BY_FIELD.group(direction), { tag: "asc" }],
					skip,
					take,
				})
			: [];

	const remaining = take - rows.length;
	if (remaining <= 0) {
		return rows;
	}

	const tail = await repo.listPage(db, {
		where: ungrouped,
		orderBy: [{ tag: "asc" }],
		skip: Math.max(0, skip - groupedCount),
		take: remaining,
	});

	return [...rows, ...tail];
}

export function createCostUnitService(deps: { repo: CostUnitRepository }) {
	const { repo } = deps;

	/** Rejects a group id that does not exist inside the caller's organization. */
	async function assertGroupInOrg(
		ctx: CostUnitServiceContext,
		costUnitGroupId: string | null,
	): Promise<void> {
		if (costUnitGroupId === null) {
			return;
		}
		const group = await repo.findGroupById(ctx.db, {
			id: costUnitGroupId,
			organizationId: ctx.organizationId,
		});
		if (!group) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Kostenstellengruppe nicht gefunden.",
			});
		}
	}

	/** Maps a unique-constraint failure to a domain message, else defers. */
	function conflictOr(error: unknown, message: string): TRPCError {
		if (isUniqueConstraintError(error)) {
			return new TRPCError({ code: "CONFLICT", message });
		}
		return mapPrismaError(error);
	}

	return {
		async list(
			ctx: CostUnitServiceContext,
			input: CostUnitListInput,
		): Promise<PaginatedCostUnits> {
			const where = buildListWhere(ctx.organizationId, input);
			const { skip, take } = offsetPageArgs(input);
			const sort = input.sorting?.[0];

			const [costUnits, totalCount] = await Promise.all([
				sort?.id === "group"
					? listUngroupedLastPage(
							{ repo, db: ctx.db },
							{ where, direction: sort.desc ? "desc" : "asc", skip, take },
						)
					: repo.listPage(ctx.db, {
							where,
							orderBy: buildListOrderBy(input.sorting),
							skip,
							take,
						}),
				repo.count(ctx.db, where),
			]);

			return { costUnits, pagination: toPageMeta(input, totalCount) };
		},

		async listForSelection(
			ctx: CostUnitServiceContext,
		): Promise<CostUnitSelectionGroupDTO[]> {
			const [groups, ungrouped] = await Promise.all([
				repo.listGroupsWithOptions(ctx.db, ctx.organizationId),
				repo.listUngroupedOptions(ctx.db, ctx.organizationId),
			]);
			return toCostUnitSelectionDTO(groups, ungrouped);
		},

		listGroups(ctx: CostUnitServiceContext): Promise<CostUnitGroupRow[]> {
			return repo.listGroups(ctx.db, ctx.organizationId);
		},

		async create(
			ctx: CostUnitServiceContext,
			input: CostUnitWriteInput,
		): Promise<CostUnitRow> {
			const costUnitGroupId = toCostUnitGroupId(input.costUnitGroupId);
			await assertGroupInOrg(ctx, costUnitGroupId);

			try {
				return await repo.create(ctx.db, {
					organizationId: ctx.organizationId,
					data: {
						tag: input.tag,
						title: input.title,
						examples: input.examples,
						color: input.color,
						costUnitGroupId,
					},
				});
			} catch (error) {
				throw conflictOr(
					error,
					"Eine Kostenstelle mit diesem Tag existiert bereits.",
				);
			}
		},

		async update(
			ctx: CostUnitServiceContext,
			costUnit: CostUnitDetail,
			input: CostUnitWriteInput & { status: CostUnitStatus },
		): Promise<CostUnitRow> {
			const costUnitGroupId = toCostUnitGroupId(input.costUnitGroupId);
			await assertGroupInOrg(ctx, costUnitGroupId);

			try {
				return await repo.update(ctx.db, {
					id: costUnit.id,
					data: {
						tag: input.tag,
						title: input.title,
						examples: input.examples,
						color: input.color,
						status: input.status,
						costUnitGroupId,
					},
				});
			} catch (error) {
				throw conflictOr(
					error,
					"Eine Kostenstelle mit diesem Tag existiert bereits.",
				);
			}
		},

		async remove(
			ctx: CostUnitServiceContext,
			costUnit: CostUnitDetail,
		): Promise<CostUnitRow> {
			try {
				return await repo.remove(ctx.db, costUnit.id);
			} catch (error) {
				throw mapPrismaError(error);
			}
		},

		async createGroup(
			ctx: CostUnitServiceContext,
			input: { title: string },
		): Promise<CostUnitGroupRow> {
			try {
				return await repo.createGroup(ctx.db, {
					organizationId: ctx.organizationId,
					title: input.title,
				});
			} catch (error) {
				throw conflictOr(
					error,
					"Eine Kostenstellengruppe mit diesem Titel existiert bereits.",
				);
			}
		},

		async updateGroup(
			ctx: CostUnitServiceContext,
			input: { id: string; title: string },
		): Promise<CostUnitGroupRow> {
			await assertGroupInOrg(ctx, input.id);

			try {
				return await repo.updateGroup(ctx.db, {
					id: input.id,
					title: input.title,
				});
			} catch (error) {
				throw conflictOr(
					error,
					"Eine Kostenstellengruppe mit diesem Titel existiert bereits.",
				);
			}
		},

		async removeGroup(
			ctx: CostUnitServiceContext,
			input: { id: string },
		): Promise<CostUnitGroupRow> {
			await assertGroupInOrg(ctx, input.id);

			try {
				return await repo.removeGroup(ctx.db, input.id);
			} catch (error) {
				throw mapPrismaError(error);
			}
		},
	};
}

export type CostUnitService = ReturnType<typeof createCostUnitService>;

export const costUnitService = createCostUnitService({
	repo: costUnitRepository,
});

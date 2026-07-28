import { TRPCError } from "@trpc/server";
import type { CostUnitStatus, Prisma, PrismaClient } from "@zemio/db";
import { NO_COST_UNIT_GROUP } from "@/lib/consts";
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
import type { CostUnitListInput } from "./cost-unit.validators";

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

function buildListWhere(
	organizationId: string,
	search: string | undefined,
): Prisma.CostUnitWhereInput {
	if (!search) {
		return { organizationId };
	}
	return {
		organizationId,
		OR: [
			{ title: { contains: search, mode: "insensitive" } },
			{ tag: { contains: search, mode: "insensitive" } },
		],
	};
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
			const where = buildListWhere(ctx.organizationId, input.search);
			const { skip, take } = offsetPageArgs(input);

			const [costUnits, totalCount] = await Promise.all([
				repo.listPage(ctx.db, { where, skip, take }),
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

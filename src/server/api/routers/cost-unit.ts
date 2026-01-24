import { TRPCError } from "@trpc/server";
import { NO_COST_UNIT_GROUP } from "@/lib/consts";
import {
	createCostUnitGroupSchema,
	createCostUnitSchema,
	deleteCostUnitGroupSchema,
	deleteCostUnitSchema,
	updateCostUnitGroupSchema,
	updateCostUnitSchema,
} from "@/lib/validators";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Checks if an error is a Prisma unique constraint violation
 */
function isPrismaUniqueConstraintError(
	error: unknown,
): error is { code: string; meta?: { target?: string[] } } {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code: string }).code === "P2002"
	);
}

export const costUnitRouter = createTRPCRouter({
	listGroupsWithUnits: protectedProcedure.query(async ({ ctx }) => {
		const [groups, ungroupedCostUnits] = await ctx.db.$transaction([
			// Fetch groups with their cost units
			ctx.db.costUnitGroup.findMany({
				include: {
					costUnits: true,
				},
				orderBy: { title: "asc" },
			}),
			// Fetch ungrouped cost units (those with costUnitGroupId = null)
			ctx.db.costUnit.findMany({
				where: { costUnitGroupId: null },
				orderBy: { tag: "asc" },
			}),
		]);

		// If there are ungrouped cost units, add them as a synthetic group
		if (ungroupedCostUnits.length > 0) {
			return [
				{
					id: NO_COST_UNIT_GROUP,
					title: "Ohne Gruppe",
					costUnits: ungroupedCostUnits,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				...groups,
			];
		}

		return groups;
	}),
	listGrouped: protectedProcedure.query(async ({ ctx }) => {
		const costUnits = await ctx.db.costUnit.findMany({
			include: {
				costUnitGroup: true,
			},
			orderBy: [{ costUnitGroup: { title: "asc" } }, { tag: "asc" }],
		});

		// Group cost units by their group
		const ungrouped: typeof costUnits = [];
		const grouped = new Map<
			string,
			{
				group: (typeof costUnits)[0]["costUnitGroup"];
				costUnits: typeof costUnits;
			}
		>();

		for (const costUnit of costUnits) {
			if (!costUnit.costUnitGroup) {
				ungrouped.push(costUnit);
			} else {
				const existing = grouped.get(costUnit.costUnitGroup.id);
				if (existing) {
					existing.costUnits.push(costUnit);
				} else {
					grouped.set(costUnit.costUnitGroup.id, {
						group: costUnit.costUnitGroup,
						costUnits: [costUnit],
					});
				}
			}
		}

		return {
			ungrouped,
			grouped: Array.from(grouped.values()),
		};
	}),

	listGroups: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.costUnitGroup.findMany({
			orderBy: { title: "asc" },
		});
	}),

	create: adminProcedure
		.input(createCostUnitSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.db.costUnit.create({
					data: {
						tag: input.tag,
						title: input.title,
						examples: input.examples,
						...(input.costUnitGroupId.length > 0 &&
							input.costUnitGroupId !== NO_COST_UNIT_GROUP && {
								costUnitGroup: {
									connect: {
										id: input.costUnitGroupId,
									},
								},
							}),
					},
				});
			} catch (error) {
				if (isPrismaUniqueConstraintError(error)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Eine Kostenstelle mit diesem Tag existiert bereits.",
					});
				}
				throw error;
			}
		}),

	update: adminProcedure
		.input(updateCostUnitSchema)
		.mutation(async ({ ctx, input }) => {
			const shouldConnectGroup =
				input.costUnitGroupId.length > 0 &&
				input.costUnitGroupId !== NO_COST_UNIT_GROUP;

			try {
				return await ctx.db.costUnit.update({
					where: { id: input.id },
					data: {
						tag: input.tag,
						title: input.title,
						examples: input.examples,
						costUnitGroupId: shouldConnectGroup ? input.costUnitGroupId : null,
					},
				});
			} catch (error) {
				if (isPrismaUniqueConstraintError(error)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Eine Kostenstelle mit diesem Tag existiert bereits.",
					});
				}
				throw error;
			}
		}),

	delete: adminProcedure
		.input(deleteCostUnitSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.costUnit.delete({
				where: { id: input.id },
			});
		}),

	createGroup: adminProcedure
		.input(createCostUnitGroupSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.db.costUnitGroup.create({
					data: {
						title: input.title,
					},
				});
			} catch (error) {
				if (isPrismaUniqueConstraintError(error)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Eine Kostenstellengruppe mit diesem Titel existiert bereits.",
					});
				}
				throw error;
			}
		}),

	updateGroup: adminProcedure
		.input(updateCostUnitGroupSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.db.costUnitGroup.update({
					where: { id: input.id },
					data: {
						title: input.title,
					},
				});
			} catch (error) {
				if (isPrismaUniqueConstraintError(error)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Eine Kostenstellengruppe mit diesem Titel existiert bereits.",
					});
				}
				throw error;
			}
		}),

	deleteGroup: adminProcedure
		.input(deleteCostUnitGroupSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.costUnitGroup.delete({
				where: { id: input.id },
			});
		}),
});

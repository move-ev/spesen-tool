import {
	createCostUnitGroupSchema,
	createCostUnitSchema,
} from "@/lib/validators";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

export const costUnitRouter = createTRPCRouter({
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
		return await ctx.db.costUnitGroup.findMany();
	}),

	create: adminProcedure
		.input(createCostUnitSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.costUnit.create({
				data: {
					tag: input.tag,
					title: input.title,
					examples: input.examples,
					...(input.costUnitGroupId.length > 0 &&
						input.costUnitGroupId !== "NONE" && {
							costUnitGroup: {
								connect: {
									id: input.costUnitGroupId,
								},
							},
						}),
				},
			});
		}),

	createGroup: adminProcedure
		.input(createCostUnitGroupSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.costUnitGroup.create({
				data: {
					title: input.title,
				},
			});
		}),
});

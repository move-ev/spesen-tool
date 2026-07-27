import { NO_COST_UNIT_GROUP } from "@/lib/consts";
import type { CostUnitOption } from "./cost-unit.repository";

/** A selectable group of cost units, as rendered by the report-create picker. */
export type CostUnitSelectionGroupDTO = {
	id: string;
	title: string;
	costUnits: CostUnitOption[];
};

/**
 * Assembles the picker tree: real groups first-class, ungrouped units collected
 * under a synthetic leading group.
 *
 * Groups with no selectable unit are omitted — an empty group is not a choice a
 * user can make, so rendering it would be noise.
 */
export function toCostUnitSelectionDTO(
	groups: CostUnitSelectionGroupDTO[],
	ungrouped: CostUnitOption[],
): CostUnitSelectionGroupDTO[] {
	const nonEmptyGroups = groups.filter((group) => group.costUnits.length > 0);

	if (ungrouped.length === 0) {
		return nonEmptyGroups;
	}

	return [
		{ id: NO_COST_UNIT_GROUP, title: "Ohne Gruppe", costUnits: ungrouped },
		...nonEmptyGroups,
	];
}

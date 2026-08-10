import type { ColumnFiltersState } from "@tanstack/react-table";
import type { ReportStatus } from "@zemio/db";
import {
	isDateRangeFilter,
	isMultiSelectFilter,
	isSelectFilter,
} from "@/components/data/filter-types";

type AdminFilterRule =
	| { field: "status"; op: "in" | "notIn"; value: ReportStatus[] }
	| { field: "ownerId"; op: "is" | "isNot"; value: string }
	| { field: "costUnitId"; op: "in" | "notIn"; value: string[] }
	| { field: "createdAt"; op: "between"; value: { start: Date; end: Date } };

type AdminFilters = { logic: "and"; rules: AdminFilterRule[] };

function buildReportGridFilters(
	columnFilters: ColumnFiltersState,
): AdminFilters | undefined {
	const rules: AdminFilterRule[] = [];

	for (const filter of columnFilters) {
		if (
			filter.id === "status" &&
			isMultiSelectFilter(filter.value) &&
			filter.value.value.length > 0
		) {
			rules.push({
				field: "status",
				op: filter.value.operator === "in" ? "in" : "notIn",
				value: filter.value.value as ReportStatus[],
			});
		}

		if (filter.id === "owner" && isSelectFilter(filter.value)) {
			rules.push({
				field: "ownerId",
				op: filter.value.operator === "is" ? "is" : "isNot",
				value: filter.value.value,
			});
		}

		if (
			filter.id === "costUnit" &&
			isMultiSelectFilter(filter.value) &&
			filter.value.value.length > 0
		) {
			rules.push({
				field: "costUnitId",
				op: filter.value.operator === "in" ? "in" : "notIn",
				value: filter.value.value,
			});
		}

		if (filter.id === "createdAt" && isDateRangeFilter(filter.value)) {
			rules.push({
				field: "createdAt",
				op: "between",
				value: { end: filter.value.end, start: filter.value.start },
			});
		}
	}

	if (rules.length === 0) return undefined;

	return { logic: "and", rules };
}

export { buildReportGridFilters };

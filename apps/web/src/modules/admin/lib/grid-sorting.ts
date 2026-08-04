import type { SortingState } from "@tanstack/react-table";

const SERVER_SORT_FIELDS = [
	"createdAt",
	"lastUpdatedAt",
	"status",
	"tag",
	"title",
] as const;

type ServerSortField = (typeof SERVER_SORT_FIELDS)[number];

function isServerSortField(id: string): id is ServerSortField {
	return (SERVER_SORT_FIELDS as readonly string[]).includes(id);
}

function buildReportGridSorting(
	sortingState: SortingState,
): Array<{ id: ServerSortField; desc: boolean }> | undefined {
	const sort = sortingState[0];
	if (!sort || !isServerSortField(sort.id)) return undefined;
	return [{ id: sort.id, desc: sort.desc }];
}

export { buildReportGridSorting };

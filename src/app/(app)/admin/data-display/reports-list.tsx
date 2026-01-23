"use client";

import type {
	ColumnFiltersState,
	ExpandedState,
	VisibilityState,
} from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getGroupedRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ListFilterIcon, Settings2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { DataListGroupHeader } from "@/components/data/data-list";
import { DisplayOptions } from "@/components/data/display-options";
import { FilterList } from "@/components/data/filter-list";
import { FilterMenu } from "@/components/data/filter-menu";
import { List, ListItem } from "@/components/list";
import { api } from "@/trpc/react";
import { createColumns, type ExtendedReport } from "./columns";

export function ReportsList() {
	const [data] = api.admin.listAll.useSuspenseQuery();

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [grouping, setGrouping] = useState<string[]>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [expanded, setExpanded] = useState<ExpandedState>(true);

	// Extract unique cost units from the dataset
	const costUnitOptions = useMemo(() => {
		const uniqueTags = [...new Set(data.map((report) => report.costUnit.tag))];
		return uniqueTags.sort().map((tag) => ({
			label: tag,
			value: tag,
		}));
	}, [data]);

	// Extract unique owners from the dataset
	const ownerOptions = useMemo(() => {
		const ownersMap = new Map<string, { name: string; image: string | null }>();
		for (const report of data) {
			if (!ownersMap.has(report.owner.email)) {
				ownersMap.set(report.owner.email, {
					name: report.owner.name,
					image: report.owner.image,
				});
			}
		}
		return Array.from(ownersMap.entries())
			.sort((a, b) => a[1].name.localeCompare(b[1].name))
			.map(([email, owner]) => ({
				label: owner.name,
				value: email,
				image: owner.image,
			}));
	}, [data]);

	// Create columns with dynamic options
	const columns = useMemo(
		() => createColumns({ costUnits: costUnitOptions, owners: ownerOptions }),
		[costUnitOptions, ownerOptions],
	);

	const table = useReactTable<ExtendedReport>({
		autoResetExpanded: false,
		enableExpanding: true,
		data,
		columns,
		state: {
			columnFilters,
			grouping,
			expanded,
			sorting,
			rowSelection,
			columnVisibility,
		},
		onColumnFiltersChange: setColumnFilters,
		onExpandedChange: setExpanded,
		onRowSelectionChange: setRowSelection,
		onGroupingChange: setGrouping,
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		groupedColumnMode: false,
		getGroupedRowModel: getGroupedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});

	return (
		<div>
			<div className="container mb-4 flex flex-nowrap items-start justify-between gap-4">
				<FilterList className="grow" table={table}>
					<FilterMenu
						className={"group/filter-menu data-[filtered=true]:size-6"}
						size={"xs"}
						table={table}
						variant={"outline"}
					>
						<ListFilterIcon />
						<span className="group-data-[filtered=true]/filter-menu:hidden">
							Filter
						</span>
					</FilterMenu>
				</FilterList>
				<DisplayOptions
					className={"shrink-0"}
					defaultExpanded={true}
					display={table}
					size={"sm"}
					variant={"outline"}
				>
					<Settings2Icon /> Display
				</DisplayOptions>
			</div>
			<List>
				{table.getRowModel().rows.map((row) => {
					if (row.getIsGrouped()) {
						return <DataListGroupHeader display={table} key={row.id} row={row} />;
					}
					return (
						<ListItem
							{...(row.getIsSelected() ? { "data-selected": true } : {})}
							className="pr-8"
							key={row.id}
						>
							{row.getVisibleCells().map((cell) => (
								<div className="has-data-spacer:grow" key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</div>
							))}
						</ListItem>
					);
				})}
			</List>
		</div>
	);
}

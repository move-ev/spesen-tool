"use client";

import type { Table } from "@tanstack/react-table";
import React from "react";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { renderFilterMenuContent } from "./filter-registry";

export type FilterMenuProps<TData> = React.ComponentProps<typeof Button> & {
	/**
	 * The TanStack Table instance to filter.
	 */
	table: Table<TData>;
};

/**
 * A dropdown menu that displays filter options for all filterable columns.
 *
 * The menu automatically detects which columns can be filtered based on their
 * `meta.filterType` configuration and renders the appropriate filter UI for each.
 *
 * @example
 * ```tsx
 * <FilterMenu table={table} variant="outline" size="sm">
 *   <FilterIcon />
 *   Filter
 * </FilterMenu>
 * ```
 */
export function FilterMenu<TData>({
	table,
	children,
	...buttonProps
}: FilterMenuProps<TData>) {
	const filterableColumns = React.useMemo(() => {
		return table.getAllColumns().filter((column) => {
			const meta = column.columnDef.meta;
			// Only include columns that can be filtered and have a valid filter type
			return (
				column.getCanFilter() &&
				meta?.filterType &&
				meta.filterType !== "none" &&
				meta.filterType !== "text" &&
				meta.filterType !== "number"
			);
		});
	}, [table]);

	const hasActiveFilters = table.getState().columnFilters.length >= 1;

	if (filterableColumns.length === 0) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				data-filtered={hasActiveFilters}
				render={<Button {...buttonProps}>{children}</Button>}
			/>
			<DropdownMenuContent className="w-full min-w-48 max-w-72">
				<DropdownMenuGroup>
					{filterableColumns.map((column) => {
						const meta = column.columnDef.meta;
						const menuContent = renderFilterMenuContent(column, table);

						if (!menuContent) return null;

						return (
							<DropdownMenuSub key={column.id}>
								<DropdownMenuSubTrigger>
									{meta?.icon && <meta.icon className="size-4" />}
									{meta?.label ?? column.id}
								</DropdownMenuSubTrigger>
								{menuContent}
							</DropdownMenuSub>
						);
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// Re-export types for convenience
export type { DateRangeFilterValue, SelectFilterValue } from "./filter-types";

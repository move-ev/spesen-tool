"use client";

import type { ColumnFiltersState, Table } from "@tanstack/react-table";
import type { ReportStatus } from "@zemio/db";
import { Button } from "@zemio/ui";
import { ListFilterIcon, Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { DisplayOptions } from "@/components/data/display-options";
import { FilterList } from "@/components/data/filter-list";
import { FilterMenu } from "@/components/data/filter-menu";
import { isMultiSelectFilter } from "@/components/data/filter-types";
import { cn } from "@/lib/utils";
import type { AdminReport } from "../lib/types";

const PENDING_STATUSES: ReportStatus[] = ["PENDING_APPROVAL"];
const PROCESSED_STATUSES: ReportStatus[] = ["ACCEPTED", "REJECTED", "PAID"];

/**
 * Checks whether the only active column filter is a `status` multiselect filter
 * holding exactly the `expected` statuses.
 */
function matchesStatusFilter(
	filters: ColumnFiltersState,
	expected: ReportStatus[],
): boolean {
	if (filters.length !== 1) {
		return false;
	}

	const filter = filters[0];

	if (filter?.id !== "status") {
		return false;
	}

	if (!isMultiSelectFilter(filter.value)) {
		return false;
	}

	const values = filter.value.value;

	return (
		values.length === expected.length &&
		expected.every((status) => values.includes(status))
	);
}

function AdminReportsGridToolbar({
	className,
	table,
	...props
}: React.ComponentProps<"div"> & {
	table: Table<AdminReport>;
}) {
	const hasActiveFilters = table.getState().columnFilters.length >= 1;

	return (
		<div className={cn("space-y-3 pb-4", className)} {...props}>
			<div className="flex items-center justify-between gap-4">
				<ToolbarQuickActions table={table} />
				<div className="flex items-center justify-center gap-2">
					<FilterMenu size={"icon-sm"} table={table} variant={"outline"}>
						<ListFilterIcon />
					</FilterMenu>
					<DisplayOptions display={table} size={"icon-sm"} variant={"outline"}>
						<Settings2Icon />
					</DisplayOptions>
				</div>
			</div>
			{hasActiveFilters && (
				<div className="rounded-lg bg-base-100 p-4">
					<FilterList table={table} />
				</div>
			)}
		</div>
	);
}

function ToolbarQuickActions({
	className,
	table,
	...props
}: React.ComponentProps<"div"> & {
	table: Table<AdminReport>;
}) {
	const t = useTranslations("modules.admin.toolbar");
	const filters = table.getState().columnFilters;

	const isShowingAll = filters.length === 0;

	const isShowingPending = React.useMemo(
		() => matchesStatusFilter(filters, PENDING_STATUSES),
		[filters],
	);

	const isShowingProcessed = React.useMemo(
		() => matchesStatusFilter(filters, PROCESSED_STATUSES),
		[filters],
	);

	const clearFilters = () => {
		table.resetColumnFilters();
	};

	const showPending = () => {
		table.setColumnFilters([
			{
				id: "status",
				value: {
					filterType: "multiselect",
					operator: "in",
					value: [...PENDING_STATUSES],
				},
			},
		]);
	};

	const showProcessed = () => {
		table.setColumnFilters([
			{
				id: "status",
				value: {
					filterType: "multiselect",
					operator: "in",
					value: [...PROCESSED_STATUSES],
				},
			},
		]);
	};

	return (
		<div
			className={cn("flex items-center justify-center gap-2", className)}
			data-slot="toolbar-quick-actions"
			{...props}
		>
			<Button
				onClick={clearFilters}
				size={"sm"}
				variant={"outline"}
				{...(isShowingAll ? { "data-active": true } : {})}
				className={
					"data-active:border-accent-200 data-active:bg-accent-100 data-active:text-accent-600"
				}
			>
				{t("all")}
			</Button>
			<Button
				onClick={showPending}
				size={"sm"}
				variant={"outline"}
				{...(isShowingPending ? { "data-active": true } : {})}
				className={
					"data-active:border-accent-200 data-active:bg-accent-100 data-active:text-accent-600"
				}
			>
				{t("pending")}
			</Button>
			<Button
				onClick={showProcessed}
				size={"sm"}
				variant={"outline"}
				{...(isShowingProcessed ? { "data-active": true } : {})}
				className={
					"data-active:border-accent-200 data-active:bg-accent-100 data-active:text-accent-600"
				}
			>
				{t("processed")}
			</Button>
		</div>
	);
}

export { AdminReportsGridToolbar };

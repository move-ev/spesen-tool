import type { Table } from "@tanstack/react-table";
import React from "react";
import type { ListLayout } from "../list";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

export function DisplayOptions<TData>({
	layout,
	onLayoutChange,
	display,
	grouping = true,
	defaultExpanded = true,
	sorting = true,
	...props
}: React.ComponentProps<typeof Button> & {
	display: Table<TData>;
	layout?: ListLayout;
	onLayoutChange?: (layout: ListLayout) => void;
	grouping?: boolean;
	defaultExpanded: boolean;
	sorting?: boolean;
}) {
	return (
		<Popover>
			<PopoverTrigger render={<Button {...props} />} />
			<PopoverContent align="end" className={"p-0"}>
				<div className="grid gap-4 p-4">
					{layout && onLayoutChange && (
						<div className="grid gap-2">
							<Label htmlFor="layout">Layout</Label>
							<Tabs onValueChange={onLayoutChange} value={layout}>
								<TabsList className="w-full">
									<TabsTrigger value="compact">Compact</TabsTrigger>
									<TabsTrigger value="default">Default</TabsTrigger>
									<TabsTrigger value="loose">Loose</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>
					)}

					{grouping && (
						<div className="grid gap-2">
							<Label htmlFor="grouping">Grouping</Label>
							<DataDisplayGrouping
								defaultExpanded={defaultExpanded}
								display={display}
								id="grouping"
							/>
						</div>
					)}
				</div>
				<Separator />
				<div className="grid gap-4 p-4">
					{sorting && (
						<div className="grid gap-2">
							<Label htmlFor="sorting">Sorting</Label>
							<DataDisplaySorting display={display} id="sorting" />
						</div>
					)}
				</div>
				<Separator />
				<div className="grid gap-2 p-4">
					<Label>Column Visibility</Label>
					<DataDisplayColumnVisibility display={display} />
				</div>
			</PopoverContent>
		</Popover>
	);
}

function DataDisplayGrouping<TData>({
	display,
	defaultExpanded,
	...props
}: React.ComponentProps<typeof NativeSelect> & {
	display: Table<TData>;
	defaultExpanded: boolean;
}) {
	const grouping = display.getState().grouping;

	const groupableColumns = React.useMemo(() => {
		return display.getAllColumns().filter((column) => column.getCanGroup());
	}, [display]);

	return (
		<NativeSelect
			className="w-full"
			onChange={(e) => {
				const value = e.target.value;

				// TODO: With this implementation, the list can only be grouped by
				// one column at a time. This should be improved to allow grouping by
				// multiple columns.
				display.setGrouping([value]);
				display.toggleAllRowsExpanded(defaultExpanded);
			}}
			size="sm"
			value={grouping[0] ?? undefined}
			{...props}
		>
			<NativeSelectOption value="">No Grouping</NativeSelectOption>

			{groupableColumns.map((column) => {
				return (
					<NativeSelectOption key={column.id} value={column.id}>
						{column.columnDef.meta?.label}
					</NativeSelectOption>
				);
			})}
		</NativeSelect>
	);
}

function DataDisplaySorting<TData>({
	display,
	...props
}: React.ComponentProps<typeof NativeSelect> & {
	display: Table<TData>;
}) {
	const sorting = display.getState().sorting;

	const sortableColumns = React.useMemo(() => {
		return display.getAllColumns().filter((column) => column.getCanSort());
	}, [display]);

	return (
		<NativeSelect
			className="w-full"
			onChange={(e) => {
				const value = e.target.value;

				if (!value) {
					display.setSorting([]);
					return;
				}

				// Preserve the current sort direction if sorting by the same column,
				// otherwise default to ascending (desc: false)
				const currentSort = sorting.find((s) => s.id === value);
				display.setSorting([{ id: value, desc: currentSort?.desc ?? false }]);
			}}
			size="sm"
			value={sorting[0]?.id ?? undefined}
			{...props}
		>
			<NativeSelectOption value="">No Sorting</NativeSelectOption>

			{sortableColumns.map((column) => {
				return (
					<NativeSelectOption key={column.id} value={column.id}>
						{column.columnDef.meta?.label}
					</NativeSelectOption>
				);
			})}
		</NativeSelect>
	);
}

function DataDisplayColumnVisibility<TData>({
	display,
	...props
}: React.ComponentProps<"div"> & {
	display: Table<TData>;
}) {
	const toggleableColumns = display
		.getAllColumns()
		.filter((column) => column.getCanHide());

	return (
		<div className="flex flex-wrap gap-1" {...props}>
			{toggleableColumns.map((column) => (
				<Button
					className="data-[hidden=true]:opacity-50"
					data-hidden={!column.getIsVisible()}
					key={column.id}
					onClick={column.getToggleVisibilityHandler()}
					size={"xs"}
					variant={"outline"}
				>
					{column.columnDef.meta?.label}
				</Button>
			))}
		</div>
	);
}

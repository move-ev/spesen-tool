import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	type Column,
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	Building2Icon,
	CalendarPlusIcon,
	CalendarSyncIcon,
	IdCardIcon,
	TagIcon,
	UsersIcon,
} from "lucide-react";
import React, { type CSSProperties, useMemo } from "react";
import { cn } from "../../../lib/cn";
import { TableRow } from "../../table";
import {
	Grid,
	GridBody,
	GridCell,
	GridHead,
	GridHeader,
	GridRow,
} from "../grid/grid";
import { DataGridColumnHeader } from "./column-header";

const meta = {
	title: "Components/DataGrid/ColumnHeader",
	component: DataGridColumnHeader,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {},
	args: {},
	render: () => {
		const data = useMemo(() => {
			return faker.helpers.multiple(
				() => ({
					id: faker.string.uuid(),
					business: faker.company.name(),
					category: faker.company.buzzNoun(),
					contact: faker.internet.email(),
					createdAt: faker.date.past(),
					dueDate: faker.date.future(),
					count: faker.number.int({ min: 1, max: 1000 }),
				}),
				{ count: 10 },
			);
		}, []);

		const columns = React.useMemo((): ColumnDef<{
			id: string;
			contact: string;
			count: number;
		}>[] => {
			return [
				{
					accessorKey: "business",
					header: ({ column }) => (
						<DataGridColumnHeader
							column={column}
							icon={Building2Icon}
							title="Unternehmen"
						/>
					),
				},
				{
					accessorKey: "category",
					header: ({ column }) => (
						<DataGridColumnHeader column={column} icon={TagIcon} title="Category" />
					),
				},
				{
					accessorKey: "contact",
					header: ({ column }) => (
						<DataGridColumnHeader column={column} icon={IdCardIcon} title="Contact" />
					),
					cell: ({ row }) => (
						<span className="font-medium text-base-700 underline underline-offset-2">
							{row.original.contact}
						</span>
					),
				},
				{
					accessorKey: "count",
					header: ({ column }) => (
						<DataGridColumnHeader column={column} icon={UsersIcon} title="Size" />
					),
					cell: ({ row }) => {
						const count = row.original.count;

						if (count < 50) {
							return (
								<span className="block w-fit rounded-sm border border-slate-200 bg-background px-1 py-0.5 font-medium text-base-700 text-xs leading-none">
									1 - 50
								</span>
							);
						}

						if (count < 200) {
							return (
								<span className="block w-fit rounded-sm border border-slate-200 bg-background px-1 py-0.5 font-medium text-base-700 text-xs leading-none">
									51 - 200
								</span>
							);
						}

						if (count < 500) {
							return (
								<span className="block w-fit rounded-sm border border-slate-200 bg-background px-1 py-0.5 font-medium text-base-700 text-xs leading-none">
									201 - 500
								</span>
							);
						}

						return (
							<span className="block w-fit rounded-sm border border-slate-200 bg-background px-1 py-0.5 font-medium text-base-700 text-xs leading-none">
								{`>`} 500
							</span>
						);
					},
				},
				{
					accessorKey: "createdAt",
					header: ({ column }) => (
						<DataGridColumnHeader
							column={column}
							icon={CalendarPlusIcon}
							title="Created at"
						/>
					),
					size: 128,
				},
				{
					accessorKey: "dueDate",
					header: ({ column }) => (
						<DataGridColumnHeader
							column={column}
							icon={CalendarSyncIcon}
							title="Due Date"
						/>
					),
				},
			];
		}, []);

		const table = useReactTable({
			columns,
			data,
			getCoreRowModel: getCoreRowModel(),
		});

		return (
			<div className="w-5xl max-w-full">
				<Grid>
					<GridHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<GridRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<GridHead
											className={cn("p-0", header.column.getIsPinned() && "bg-background")}
											key={header.id}
											style={{
												width: header.getSize(),
												...getPinningStyles(header.column),
											}}
										>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</GridHead>
									);
								})}
							</GridRow>
						))}
					</GridHeader>
					<GridBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<GridRow data-state={row.getIsSelected() && "selected"} key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<GridCell
											className={cn(cell.column.getIsPinned() && "bg-background")}
											key={cell.id}
											style={getPinningStyles(cell.column)}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</GridCell>
									))}
								</GridRow>
							))
						) : (
							<TableRow>
								<GridCell className="h-24 text-center" colSpan={columns.length}>
									No results.
								</GridCell>
							</TableRow>
						)}
					</GridBody>
				</Grid>
			</div>
		);
	},
} satisfies Meta<React.ComponentProps<typeof DataGridColumnHeader>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

function getPinningStyles<TData, TValue>(
	column: Column<TData, TValue>,
): CSSProperties {
	const isPinned = column.getIsPinned();
	if (!isPinned) return {};
	return {
		position: "sticky",
		zIndex: 1,
		left: isPinned === "left" ? column.getStart("left") : undefined,
		right: isPinned === "right" ? column.getAfter("right") : undefined,
	};
}

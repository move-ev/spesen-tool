"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react";
import { keepPreviousData } from "@tanstack/react-query";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type PaginationState,
	useReactTable,
} from "@tanstack/react-table";
import type { CostUnitColor, CostUnitStatus } from "@zemio/db";
import {
	Button,
	DataGridColumnHeader,
	Grid,
	GridBody,
	GridCell,
	GridFooter,
	GridHead,
	GridHeader,
	GridRow,
	getPinningStyles,
} from "@zemio/ui";
import { format } from "date-fns";
import {
	CalendarPlusIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CircleIcon,
	EllipsisIcon,
	ListIcon,
	LoaderIcon,
	TagIcon,
	TextIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { COST_UNIT_COLORS } from "@/lib/colors/cost-units";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { SettingsSubtitle, SettingsTitle } from "../settings-typography";
import {
	type CreateCostUnitHandle,
	CreateCostUnitSheet,
	CreateCostUnitSheetTrigger,
	createCostUnitCreateHandle,
} from "./create-cost-unit";
import {
	CreateCostUnitGroupSheet,
	CreateCostUnitGroupSheetTrigger,
} from "./create-cost-unit-group";
import {
	createCostUnitUpdateHandle,
	type UpdateCostUnitHandle,
	UpdateCostUnitSheet,
} from "./update-cost-unit";

function OrgSettingsCostUnits({
	className,
	...props
}: React.ComponentProps<"main">) {
	const t = useTranslations("modules.settings.costUnits");

	return (
		<main
			className={cn("py-16", className)}
			data-slot="org-settings-cost-units"
			{...props}
		>
			<div className="container flex max-w-4xl flex-wrap items-start justify-between gap-6">
				<div className="space-y-1">
					<SettingsTitle>{t("title")}</SettingsTitle>
					<SettingsSubtitle>{t("description")}</SettingsSubtitle>
				</div>
				<OrgSettingsCostUnitsActions className="flex items-center justify-center gap-4" />
			</div>
			<div className="mt-12 max-w-full">
				<CostUnitsGrid />
			</div>
		</main>
	);
}

function OrgSettingsCostUnitsActions({
	className,
	...props
}: React.ComponentProps<"div">) {
	const t = useTranslations("modules.settings.costUnits");
	const createHandleRef = React.useRef<CreateCostUnitHandle | null>(null);
	if (!createHandleRef.current)
		createHandleRef.current = createCostUnitCreateHandle();
	const createHandle = createHandleRef.current;

	const createGroupHandleRef = React.useRef<CreateCostUnitHandle | null>(null);
	if (!createGroupHandleRef.current)
		createGroupHandleRef.current = createCostUnitCreateHandle();
	const createGroupHandle = createGroupHandleRef.current;

	return (
		<>
			<div
				className={cn("", className)}
				data-slot="org-settings-cost-units-actions"
				{...props}
			>
				<CreateCostUnitGroupSheetTrigger
					handle={createGroupHandle}
					variant={"outline"}
				>
					{t("newGroupButton")}
				</CreateCostUnitGroupSheetTrigger>
				<CreateCostUnitSheetTrigger handle={createHandle}>
					{t("newCostUnitButton")}
				</CreateCostUnitSheetTrigger>
			</div>
			<CreateCostUnitSheet handle={createHandle} />
			<CreateCostUnitGroupSheet closeOnSuccess handle={createGroupHandle} />
		</>
	);
}

// ========= COST UNITS GRID =============================================

function createCostUnitsGridColumns(
	handle: UpdateCostUnitHandle,
	t: ColumnTranslator,
): ColumnDef<FetchedCostUnit>[] {
	return [
		{
			id: "tag",
			accessorKey: "tag",
			header: ({ column }) => (
				<DataGridColumnHeader
					column={column}
					icon={TagIcon}
					title={t("table.tag")}
				/>
			),
		},
		{
			id: "title",
			accessorKey: "title",
			cell: ({ row }) => {
				return (
					<span className="flex items-center justify-start gap-2 font-semibold text-slate-800">
						<span
							className="block size-2 rounded-xs"
							style={{
								backgroundColor: COST_UNIT_COLORS[row.original.color]?.fill,
							}}
						/>
						{row.original.title}
					</span>
				);
			},
			header: ({ column }) => (
				<DataGridColumnHeader
					column={column}
					icon={TextIcon}
					title={t("table.title")}
				/>
			),
		},

		{
			id: "group",
			accessorFn: (original) => {
				return original.costUnitGroup?.title ?? t("table.noGroup");
			},
			header: ({ column }) => (
				<DataGridColumnHeader
					column={column}
					icon={CalendarPlusIcon}
					title={t("table.group")}
				/>
			),
			cell: ({ row }) => {
				return (
					<Badge variant={"outline"}>
						{row.original.costUnitGroup?.title ?? t("table.noGroup")}
					</Badge>
				);
			},
		},
		{
			id: "status",
			accessorFn: (original) => {
				return original.status;
			},
			header: ({ column }) => (
				<DataGridColumnHeader
					column={column}
					icon={LoaderIcon}
					title={t("table.status")}
				/>
			),
			cell: ({ row }) => {
				if (row.original.status === "ARCHIVED") {
					return (
						<Badge className="pl-1.25" variant={"outline"}>
							<CircleIcon className="text-white **:fill-orange-500" />
							{t("table.statusArchived")}
						</Badge>
					);
				}

				return (
					<Badge className="pl-1.25" variant={"outline"}>
						<CircleIcon className="text-white **:fill-green-500" />
						{t("table.statusActive")}
					</Badge>
				);
			},
		},
		{
			id: "examples",
			accessorFn: (original) => {
				return original.examples.length;
			},
			cell: ({ row }) => {
				return (
					<span>
						{t("table.examplesCount", { count: row.original.examples.length })}
					</span>
				);
			},
			header: ({ column }) => (
				<DataGridColumnHeader
					column={column}
					icon={ListIcon}
					title={t("table.examples")}
				/>
			),
		},
		{
			id: "createdAt",
			accessorFn: (original) => {
				return original.createdAt;
			},
			cell: ({ row }) => {
				return format(row.original.createdAt, "dd.MM.yyyy, HH:mm");
			},
			header: ({ column }) => (
				<DataGridColumnHeader
					column={column}
					icon={CalendarPlusIcon}
					title={t("table.createdAt")}
				/>
			),
		},
		{
			id: "action",
			cell: ({ row }) => (
				<DialogPrimitive.Trigger
					handle={handle}
					payload={{
						id: row.original.id,
					}}
					render={
						<Button
							className={
								"shadow-none ring-0 group-hover/row:shadow-sm group-hover/row:ring-1"
							}
							size={"icon-sm"}
							variant={"outline"}
						>
							<EllipsisIcon />
						</Button>
					}
				/>
			),
		},
	];
}

function CostUnitsGrid({ className, ...props }: React.ComponentProps<"div">) {
	const t = useTranslations("modules.settings.costUnits");
	const PAGE_SIZE = 20;

	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: PAGE_SIZE,
	});

	const updateHandleRef = React.useRef<UpdateCostUnitHandle | null>(null);
	if (!updateHandleRef.current)
		updateHandleRef.current = createCostUnitUpdateHandle();
	const updateHandle = updateHandleRef.current;

	const columns = React.useMemo(() => {
		return createCostUnitsGridColumns(updateHandle, t as ColumnTranslator);
	}, [updateHandle, t]);

	const dataQuery = api.costUnit.listCostUnits.useQuery(
		{
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			search: undefined,
		},
		{
			placeholderData: keepPreviousData,
		},
	);

	const table = useReactTable({
		data: dataQuery.data?.items ?? [],
		rowCount: dataQuery.data?.totalCount,
		columns,
		state: {
			pagination,
			// sorting,
		},
		getCoreRowModel: getCoreRowModel(),
		onPaginationChange: setPagination,
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
	});

	if (dataQuery.isPending) {
		return null;
	}

	if (dataQuery.error) {
		return <p>{JSON.stringify(dataQuery.error)}</p>;
	}

	const { data } = dataQuery;

	return (
		<div className={cn("", className)} data-slot="cost-units-table" {...props}>
			<div
				className="border-base-200 border-t transition-opacity data-[fetching=true]:opacity-50"
				data-fetching={dataQuery.isFetching}
			>
				<Grid className="w-full">
					<GridHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<GridRow className="border-b" key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<GridHead
											className="p-0"
											key={header.id}
											style={{ ...getPinningStyles(header.column) }}
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
								<GridRow className="group/row" key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<GridCell key={cell.id} style={{ ...getPinningStyles(cell.column) }}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</GridCell>
									))}
								</GridRow>
							))
						) : (
							<tr>
								<td
									className="h-24 text-center"
									colSpan={table.getVisibleFlatColumns().length}
								>
									{t("table.noResults")}
								</td>
							</tr>
						)}
					</GridBody>
					<GridFooter>
						<GridRow>
							<GridCell colSpan={columns.length}>
								<div className="flex flex-wrap justify-between gap-4 border-slate-200">
									<span className="text-slate-500 text-sm">
										{t("table.unitsCount", { count: data.totalCount })}
									</span>
									<div className="flex items-center justify-center gap-2">
										<span className="me-2 text-slate-500 text-sm">
											{t("table.pageIndicator", {
												current: pagination.pageIndex + 1,
												total: Math.ceil(data.totalCount / PAGE_SIZE),
											})}
										</span>
										<Button
											disabled={!table.getCanPreviousPage()}
											onClick={() => table.previousPage()}
											size={"icon-sm"}
											variant={"outline"}
										>
											<ChevronLeftIcon />
										</Button>
										<Button
											disabled={!table.getCanNextPage()}
											onClick={() => table.nextPage()}
											size={"icon-sm"}
											variant={"outline"}
										>
											<ChevronRightIcon />
										</Button>
									</div>
								</div>
							</GridCell>
						</GridRow>
					</GridFooter>
				</Grid>
			</div>
			<UpdateCostUnitSheet handle={updateHandle} />
		</div>
	);
}

type FetchedCostUnit = {
	id: string;
	tag: string;
	title: string;
	examples: string[];
	costUnitGroupId: string | null;
	costUnitGroup: {
		title: string;
	} | null;
	color: CostUnitColor;
	createdAt: Date;
	status: CostUnitStatus;
};

type ColumnTranslator = (
	key: string,
	values?: Record<string, string | number>,
) => string;

export { OrgSettingsCostUnits };

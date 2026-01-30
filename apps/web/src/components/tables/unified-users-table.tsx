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
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@zemio/ui/components/empty";
import { Input } from "@zemio/ui/components/input";
import { Pagination, PaginationInfo } from "@zemio/ui/components/pagination";
import { Skeleton } from "@zemio/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@zemio/ui/components/table";
import {
	AlertCircleIcon,
	Loader2Icon,
	SearchXIcon,
	UsersIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	unifiedUsersSearchParams,
	urlStateValidation,
} from "@/lib/schemas/url-state";
import { api } from "@/trpc/react";
import { unifiedUsersColumns } from "./unified-users-columns";

const PAGE_SIZE = 20;

/**
 * Skeleton loader for table rows
 */
function TableSkeleton({ count = 8 }: { count?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: count }).map((_, i) => (
				<div
					className="flex items-center gap-4 p-4"
					key={`skeleton-${i.toString()}`}
				>
					<Skeleton className="size-6 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-1/3" />
						<Skeleton className="h-3 w-1/2" />
					</div>
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-8 w-24" />
				</div>
			))}
		</div>
	);
}

/**
 * Error state display with retry functionality
 */
function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<AlertCircleIcon />
				</EmptyMedia>
				<EmptyTitle>Fehler beim Laden</EmptyTitle>
				<EmptyDescription>
					{error.message || "Die Benutzerliste konnte nicht geladen werden."}
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<button
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
					onClick={retry}
					type="button"
				>
					Erneut versuchen
				</button>
			</EmptyContent>
		</Empty>
	);
}

/**
 * Empty state when no users exist
 */
function NoUsersState() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<UsersIcon />
				</EmptyMedia>
				<EmptyTitle>Keine Benutzer</EmptyTitle>
				<EmptyDescription>
					Es sind noch keine Mitglieder oder Einladungen vorhanden.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}

/**
 * Empty state when search returns no results
 */
function NoSearchResultsState({ searchTerm }: { searchTerm: string }) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<SearchXIcon />
				</EmptyMedia>
				<EmptyTitle>Keine Ergebnisse</EmptyTitle>
				<EmptyDescription>
					Keine Benutzer mit &quot;{searchTerm}&quot; gefunden.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}

/**
 * Props for UnifiedUsersTable component
 */
interface UnifiedUsersTableProps {
	/**
	 * Initial page number from server-side URL parsing
	 * @default 1
	 */
	initialPage?: number;

	/**
	 * Initial search string from server-side URL parsing
	 * @default ""
	 */
	initialSearch?: string;
}

/**
 * Unified users table component with URL-synced pagination and filtering.
 *
 * Features:
 * - URL state management with nuqs (shareable URLs, deep linking)
 * - True server-side page-based pagination
 * - Email search with built-in throttling (300ms)
 * - Grouped display (members first, then invitations)
 * - Loading, error, and empty states
 * - Accessibility attributes
 * - Browser history integration
 *
 * URL Structure:
 * - /org/settings/members                    (default view)
 * - /org/settings/members?page=2             (page 2)
 * - /org/settings/members?search=john        (search filter)
 * - /org/settings/members?page=3&search=test (combined)
 *
 * @param initialPage - Initial page from server-side URL parsing
 * @param initialSearch - Initial search from server-side URL parsing
 *
 * @example
 * ```tsx
 * // In server component
 * const { page, search } = await parseSearchParams(searchParams);
 * <UnifiedUsersTable initialPage={page} initialSearch={search} />
 * ```
 */
export function UnifiedUsersTable({
	initialPage = 1,
	initialSearch = "",
}: UnifiedUsersTableProps) {
	// URL-synced state using nuqs
	// These hooks automatically sync with URL parameters
	const [page, setPage] = useQueryState(
		"page",
		unifiedUsersSearchParams.page.withDefault(initialPage),
	);

	const [emailFilter, setEmailFilter] = useQueryState(
		"search",
		unifiedUsersSearchParams.search.withDefault(initialSearch),
	);

	// Track if we've ever successfully loaded data (to differentiate initial load from refetch)
	const hasLoadedOnce = useRef(false);

	// Validate and sanitize search input
	const validatedSearch = useMemo(
		() => urlStateValidation.validateSearch(emailFilter ?? ""),
		[emailFilter],
	);

	// Regular query with pagination
	// Uses validated search and current page from URL
	const {
		data: usersData,
		isLoading,
		isFetching,
		isError,
		error,
		refetch,
	} = api.organization.listUsersUnified.useQuery(
		{
			page: page ?? 1,
			pageSize: PAGE_SIZE,
			emailFilter: validatedSearch || undefined,
		},
		{
			// Keep previous data while fetching to prevent flickering
			placeholderData: (previousData) => previousData,
		},
	);

	// Update ref when we have data
	useEffect(() => {
		if (usersData) {
			hasLoadedOnce.current = true;
		}
	}, [usersData]);

	// Memoized data and pagination info
	const { items, pagination, counts } = useMemo(() => {
		if (!usersData) {
			return {
				items: [],
				pagination: {
					page: 1,
					pageSize: PAGE_SIZE,
					totalCount: 0,
					totalPages: 1,
					hasNextPage: false,
					hasPreviousPage: false,
				},
				counts: { members: 0, invitations: 0 },
			};
		}

		return {
			items: usersData.items,
			pagination: usersData.pagination,
			counts: usersData.counts,
		};
	}, [usersData]);

	// Validate page number against total pages
	// Clamps page to valid range if user manually edits URL.
	// Only run when we have real data: while loading, pagination.totalPages is 1
	// (fallback), which would incorrectly clamp e.g. ?page=3 to 1 on fresh load.
	useEffect(() => {
		if (!usersData) return;

		const currentPage = page ?? 1;
		const validPage = urlStateValidation.clampPage(
			currentPage,
			pagination.totalPages,
		);

		// Only update if page is actually invalid
		if (validPage !== currentPage && pagination.totalPages > 0) {
			void setPage(validPage);
		}
	}, [usersData, page, pagination.totalPages, setPage]);

	// Reset to page 1 when search filter changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally exclude page and setPage to avoid infinite loop
	useEffect(() => {
		if (emailFilter && page !== 1) {
			void setPage(1);
		}
	}, [emailFilter]);

	// Table state
	const [grouping, setGrouping] = useState<string[]>(["type"]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [expanded, setExpanded] = useState<ExpandedState>(true);

	// Initialize table with grouping
	const table = useReactTable({
		autoResetExpanded: false,
		autoResetPageIndex: false,
		enableExpanding: true,
		data: items,
		columns: unifiedUsersColumns,
		state: {
			columnFilters,
			grouping,
			expanded,
			sorting,
			columnVisibility,
		},
		onColumnFiltersChange: setColumnFilters,
		onExpandedChange: setExpanded,
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

	const { rows } = table.getRowModel();

	// Handle initial loading state (only show skeleton on the VERY FIRST LOAD)
	const isInitialLoading = isLoading && !hasLoadedOnce.current;

	if (isInitialLoading) {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-4">
					<Skeleton className="h-10 w-full max-w-sm" />
					<Skeleton className="h-4 w-48" />
				</div>
				<TableSkeleton count={PAGE_SIZE} />
			</div>
		);
	}

	// Check if we're refetching (not initial load)
	const isRefetching = isFetching && hasLoadedOnce.current;

	// Handle error state
	if (isError) {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-4">
					<div className="relative w-full max-w-sm">
						<Input
							aria-label="E-Mail Suche"
							className="w-full"
							onChange={(e) => void setEmailFilter(e.target.value)}
							placeholder="Nach E-Mail suchen..."
							value={emailFilter ?? ""}
						/>
						{isRefetching && (
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
								<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
							</div>
						)}
					</div>
				</div>
				<ErrorState
					error={
						error instanceof Error
							? error
							: new Error("Ein unbekannter Fehler ist aufgetreten")
					}
					retry={() => void refetch()}
				/>
			</div>
		);
	}

	// Handle empty states
	const hasNoData = items.length === 0;
	const isSearching = (emailFilter ?? "").length > 0;

	if (hasNoData && !isSearching) {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-4">
					<div className="relative w-full max-w-sm">
						<Input
							aria-label="E-Mail Suche"
							className="w-full"
							onChange={(e) => void setEmailFilter(e.target.value)}
							placeholder="Nach E-Mail suchen..."
							value={emailFilter ?? ""}
						/>
						{isRefetching && (
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
								<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
							</div>
						)}
					</div>
					<PaginationInfo
						currentPage={page ?? 1}
						pageSize={PAGE_SIZE}
						totalCount={pagination.totalCount}
					/>
				</div>
				<NoUsersState />
			</div>
		);
	}

	if (hasNoData && isSearching) {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-4">
					<div className="relative w-full max-w-sm">
						<Input
							aria-label="E-Mail Suche"
							className="w-full"
							onChange={(e) => void setEmailFilter(e.target.value)}
							placeholder="Nach E-Mail suchen..."
							value={emailFilter ?? ""}
						/>
						{isRefetching && (
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
								<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
							</div>
						)}
					</div>
					<PaginationInfo
						currentPage={page ?? 1}
						pageSize={PAGE_SIZE}
						totalCount={pagination.totalCount}
					/>
				</div>
				<NoSearchResultsState searchTerm={validatedSearch} />
			</div>
		);
	}

	// Render table with data
	return (
		<div className="flex flex-col gap-4">
			{/* Header with search and info */}
			<div className="flex items-center justify-between gap-4">
				<div className="relative w-full max-w-sm">
					<Input
						aria-label="E-Mail Suche"
						className="w-full"
						onChange={(e) => void setEmailFilter(e.target.value)}
						placeholder="Nach E-Mail suchen..."
						value={emailFilter ?? ""}
					/>
					{isRefetching && (
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
							<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
						</div>
					)}
				</div>
				<div className="flex flex-col items-end gap-1">
					<PaginationInfo
						currentPage={page ?? 1}
						pageSize={PAGE_SIZE}
						totalCount={pagination.totalCount}
					/>
					<span className="text-muted-foreground text-xs">
						{counts.members} Mitglieder, {counts.invitations} Einladungen
					</span>
				</div>
			</div>

			{/* Table */}
			<div aria-busy={isRefetching}>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{rows.map((row) => {
							if (row.getIsGrouped()) {
								return (
									<TableRow className="bg-muted hover:bg-muted" key={row.id}>
										<TableCell />
										<TableCell className="font-medium text-foreground" colSpan={6}>
											{row.getValue("type")}
										</TableCell>
									</TableRow>
								);
							}

							return (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{/* Pagination Controls */}
			<div className="flex items-center justify-center">
				<Pagination
					currentPage={page ?? 1}
					disabled={isRefetching}
					onPageChange={(newPage) => void setPage(newPage)}
					showFirstLast
					totalPages={pagination.totalPages}
				/>
			</div>
		</div>
	);
}

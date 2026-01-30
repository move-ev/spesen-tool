"use client";

import { Button } from "@zemio/ui/components/button";
import { cn } from "@zemio/ui/lib/utils";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	MoreHorizontalIcon,
} from "lucide-react";

/**
 * Pagination component props
 */
export interface PaginationProps {
	/** Current page number (1-indexed) */
	currentPage: number;
	/** Total number of pages */
	totalPages: number;
	/** Callback when page changes */
	onPageChange: (page: number) => void;
	/** Number of page buttons to show around current page (default: 1) */
	siblingCount?: number;
	/** Whether pagination is disabled (e.g., during loading) */
	disabled?: boolean;
	/** Additional CSS classes */
	className?: string;
	/** Show first/last page buttons */
	showFirstLast?: boolean;
}

/**
 * Generates an array of page numbers to display in pagination.
 *
 * Strategy:
 * - Always show first and last page
 * - Show current page and siblings around it
 * - Show ellipsis (...) for gaps
 *
 * Example with siblingCount=1:
 * - Page 1: [1, 2, 3, ..., 10]
 * - Page 5: [1, ..., 4, 5, 6, ..., 10]
 * - Page 10: [1, ..., 8, 9, 10]
 *
 * @param currentPage - Current page (1-indexed)
 * @param totalPages - Total number of pages
 * @param siblingCount - Number of siblings on each side
 * @returns Array of page numbers or 'ellipsis' markers
 */
function generatePageNumbers(
	currentPage: number,
	totalPages: number,
	siblingCount = 1,
): (number | "ellipsis")[] {
	// If total pages is small, show all pages
	const totalPageNumbers = siblingCount * 2 + 5; // siblings * 2 + current + first + last + 2 ellipsis

	if (totalPages <= totalPageNumbers) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
	const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

	const showLeftEllipsis = leftSiblingIndex > 2;
	const showRightEllipsis = rightSiblingIndex < totalPages - 1;

	const pages: (number | "ellipsis")[] = [];

	// Always show first page
	pages.push(1);

	// Left ellipsis
	if (showLeftEllipsis) {
		pages.push("ellipsis");
	} else if (leftSiblingIndex === 2) {
		// No ellipsis needed, just show page 2
		pages.push(2);
	}

	// Current page and siblings
	for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
		if (i !== 1 && i !== totalPages) {
			pages.push(i);
		}
	}

	// Right ellipsis
	if (showRightEllipsis) {
		pages.push("ellipsis");
	} else if (rightSiblingIndex === totalPages - 1) {
		// No ellipsis needed, just show second-to-last page
		pages.push(totalPages - 1);
	}

	// Always show last page
	if (totalPages > 1) {
		pages.push(totalPages);
	}

	return pages;
}

/**
 * Pagination component for navigating through pages of data.
 *
 * Features:
 * - Smart page number generation with ellipsis
 * - First/Last page navigation
 * - Previous/Next navigation
 * - Keyboard accessible
 * - Disabled state support
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={5}
 *   totalPages={20}
 *   onPageChange={(page) => setPage(page)}
 *   showFirstLast
 * />
 * ```
 */
export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	siblingCount = 1,
	disabled = false,
	className,
	showFirstLast = true,
}: PaginationProps) {
	const pages = generatePageNumbers(currentPage, totalPages, siblingCount);

	const canGoPrevious = currentPage > 1;
	const canGoNext = currentPage < totalPages;

	const handlePageChange = (page: number) => {
		if (page < 1 || page > totalPages || page === currentPage || disabled) {
			return;
		}
		onPageChange(page);
	};

	// If only one page, don't show pagination
	if (totalPages <= 1) {
		return null;
	}

	return (
		<nav
			aria-label="Pagination"
			className={cn("flex items-center justify-center gap-1", className)}
		>
			{/* First page button */}
			{showFirstLast && (
				<Button
					aria-label="Zur ersten Seite"
					disabled={disabled || !canGoPrevious}
					onClick={() => handlePageChange(1)}
					size="icon-sm"
					title="Zur ersten Seite"
					variant="outline"
				>
					<ChevronsLeftIcon />
				</Button>
			)}

			{/* Previous page button */}
			<Button
				aria-label="Vorherige Seite"
				disabled={disabled || !canGoPrevious}
				onClick={() => handlePageChange(currentPage - 1)}
				size="icon-sm"
				title="Vorherige Seite"
				variant="outline"
			>
				<ChevronLeftIcon />
			</Button>

			{/* Page number buttons */}
			<div className="flex items-center gap-1">
				{pages.map((page) => {
					if (page === "ellipsis") {
						return (
							<div
								aria-hidden="true"
								className="flex size-7 items-center justify-center"
								key={`ellipsis-${page.toString()}`}
							>
								<MoreHorizontalIcon className="size-4 text-muted-foreground" />
							</div>
						);
					}

					const isCurrentPage = page === currentPage;

					return (
						<Button
							aria-current={isCurrentPage ? "page" : undefined}
							aria-label={`Seite ${page}`}
							className={cn("min-w-7", isCurrentPage && "pointer-events-none")}
							disabled={disabled}
							key={page}
							onClick={() => handlePageChange(page)}
							size="icon-sm"
							title={`Seite ${page}`}
							variant={isCurrentPage ? "default" : "outline"}
						>
							{page}
						</Button>
					);
				})}
			</div>

			{/* Next page button */}
			<Button
				aria-label="Nächste Seite"
				disabled={disabled || !canGoNext}
				onClick={() => handlePageChange(currentPage + 1)}
				size="icon-sm"
				title="Nächste Seite"
				variant="outline"
			>
				<ChevronRightIcon />
			</Button>

			{/* Last page button */}
			{showFirstLast && (
				<Button
					aria-label="Zur letzten Seite"
					disabled={disabled || !canGoNext}
					onClick={() => handlePageChange(totalPages)}
					size="icon-sm"
					title="Zur letzten Seite"
					variant="outline"
				>
					<ChevronsRightIcon />
				</Button>
			)}
		</nav>
	);
}

/**
 * Pagination info component showing current range and total count.
 *
 * @example
 * ```tsx
 * <PaginationInfo
 *   currentPage={2}
 *   pageSize={20}
 *   totalCount={150}
 * />
 * // Output: "21-40 von 150"
 * ```
 */
export function PaginationInfo({
	currentPage,
	pageSize,
	totalCount,
	className,
}: {
	currentPage: number;
	pageSize: number;
	totalCount: number;
	className?: string;
}) {
	const start = (currentPage - 1) * pageSize + 1;
	const end = Math.min(currentPage * pageSize, totalCount);

	if (totalCount === 0) {
		return (
			<div className={cn("text-muted-foreground text-sm", className)}>
				Keine Einträge
			</div>
		);
	}

	return (
		<div className={cn("text-muted-foreground text-sm", className)}>
			{start}-{end} von {totalCount}
		</div>
	);
}

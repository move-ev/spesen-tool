"use client";

import type * as React from "react";
import { cn } from "../../../lib/cn";

/**
 * Grid Component can be used to render Data Grids, allowing for an easy
 * overview of data, similar to a table.
 *
 * **Composition**
 *```
 * Grid
 * ├── GridHeader
 * │   └── GridRow
 * │       └── GridHead
 * ├── GridBody
 * │   └── GridRow
 * │       └── GridCell
 * └── GridFooter
 *     └── GridRow
 *         └── GridCell
 *```
 * @param param0
 * @returns
 */

function Grid({
	className,
	layout = "default",
	...props
}: React.ComponentProps<"table"> & {
	layout?: "compact" | "default" | "loose";
}) {
	return (
		<div
			className={cn(
				"group/grid relative w-full min-w-0 max-w-full overflow-x-auto",
				"[--grid-cell-px:1rem] [--grid-cell-py:0.75rem]",
				"data-[layout=compact]:[--grid-cell-px:0.625rem] data-[layout=compact]:[--grid-cell-py:0.5rem]",
				"data-[layout=loose]:[--grid-cell-px:1.125rem] data-[layout=loose]:[--grid-cell-py:1rem]",
			)}
			data-layout={layout}
			data-slot="table-container"
		>
			<table
				className={cn(
					"w-full caption-bottom border-separate border-spacing-0 text-sm",
					className,
				)}
				data-slot="table"
				{...props}
			/>
		</div>
	);
}

function GridHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return (
		<thead
			className={cn("border-base-200 [&_tr]:border-b", className)}
			data-slot="table-header"
			{...props}
		/>
	);
}

function GridBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return (
		<tbody className={cn("", className)} data-slot="table-body" {...props} />
	);
}

function GridFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
	return (
		<tfoot
			className={cn(
				"border-base-200 border-t bg-base-100 font-medium [&>tr]:last:border-b-0 [&_td]:text-base-800",
				className,
			)}
			data-slot="table-footer"
			{...props}
		/>
	);
}

function GridRow({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			className={cn(
				"border-base-200 transition-colors [&_td]:border-b [&_th]:border-b",
				className,
			)}
			data-slot="table-row"
			{...props}
		/>
	);
}

function GridHead({ className, ...props }: React.ComponentProps<"th">) {
	return (
		<th
			className={cn(
				"items-center whitespace-nowrap border-base-200 border-r px-(--grid-cell-px) py-(--grid-cell-py) font-normal text-base-500 text-sm [&_svg:not([class*='size-'])]:size-3.5 [&_svg:not([class*='text-'])]:text-base-400",
				"**:data-content:flex **:data-content:items-center **:data-content:justify-start **:data-content:gap-2",
				className,
			)}
			data-slot="table-head"
			{...props}
		/>
	);
}

/**
 * Used to displac a cell within the Grid. Use the data-content attribute to
 * target the inner div element.
 *
 * @param param0
 * @returns
 */
function GridCell({
	className,
	children,
	...props
}: React.ComponentProps<"td">) {
	return (
		<td
			className={cn(
				"whitespace-nowrap border-base-200 border-r align-middle text-base-500 last:border-r-0",
				className,
			)}
			data-slot="table-cell"
			{...props}
		>
			<div className="px-(--grid-cell-px) py-(--grid-cell-py)" data-content>
				{children}
			</div>
		</td>
	);
}

export { Grid, GridBody, GridCell, GridFooter, GridHead, GridHeader, GridRow };

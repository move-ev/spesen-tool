"use client";

import type * as React from "react";
import { cn } from "../../lib/cn";

function Table({ className, ...props }: React.ComponentProps<"table">) {
	return (
		<div className="relative w-full overflow-x-auto" data-slot="table-container">
			<table
				className={cn("w-full caption-bottom text-sm", className)}
				data-slot="table"
				{...props}
			/>
		</div>
	);
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return (
		<thead
			className={cn("border-base-200 [&_tr]:border-b", className)}
			data-slot="table-header"
			{...props}
		/>
	);
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return (
		<tbody
			className={cn("[&_tr:last-child]:border-0", className)}
			data-slot="table-body"
			{...props}
		/>
	);
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
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

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			className={cn(
				"border-base-200 border-b transition-colors hover:bg-base-100 has-aria-expanded:bg-base-100 data-[state=selected]:bg-accent-100 data-[state=selected]:**:text-accent-500",
				className,
			)}
			data-slot="table-row"
			{...props}
		/>
	);
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
	return (
		<th
			className={cn(
				"h-8 whitespace-nowrap px-2 text-left align-middle font-medium text-base-700 text-xs has-[[role=checkbox]]:pr-0",
				className,
			)}
			data-slot="table-head"
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
	return (
		<td
			className={cn(
				"whitespace-nowrap px-2 py-3 align-middle text-base-500 has-[[role=checkbox]]:pr-0",
				className,
			)}
			data-slot="table-cell"
			{...props}
		/>
	);
}

function TableCaption({
	className,
	...props
}: React.ComponentProps<"caption">) {
	return (
		<caption
			className={cn("mt-4 text-base-500 text-xs", className)}
			data-slot="table-caption"
			{...props}
		/>
	);
}

export {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
};

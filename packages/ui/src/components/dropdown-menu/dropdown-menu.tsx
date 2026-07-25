"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "../../lib/cn";

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
	return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
	return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
	className,
	...props
}: MenuPrimitive.Trigger.Props) {
	return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
	align = "start",
	alignOffset = 0,
	side = "bottom",
	sideOffset = 4,
	className,
	...props
}: MenuPrimitive.Popup.Props &
	Pick<
		MenuPrimitive.Positioner.Props,
		"align" | "alignOffset" | "side" | "sideOffset"
	>) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				className="isolate z-50 outline-none"
				side={side}
				sideOffset={sideOffset}
			>
				<MenuPrimitive.Popup
					className={cn(
						"data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
						"z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-y-auto overflow-x-hidden rounded-md bg-background text-base-700 shadow-md outline-none ring-1 ring-base-700/10 duration-100",
						"data-closed:animate-out data-open:animate-in data-closed:overflow-hidden",
						className,
					)}
					data-slot="dropdown-menu-content"
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	);
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
	return (
		<MenuPrimitive.Group
			className={"space-y-0.5 p-1"}
			data-slot="dropdown-menu-group"
			{...props}
		/>
	);
}

function DropdownMenuLabel({
	className,
	inset,
	...props
}: MenuPrimitive.GroupLabel.Props & {
	inset?: boolean;
}) {
	return (
		<MenuPrimitive.GroupLabel
			className={cn(
				"px-2 py-1 font-medium text-base-500 text-xs data-inset:pl-8",
				className,
			)}
			data-inset={inset}
			data-slot="dropdown-menu-label"
			{...props}
		/>
	);
}

function DropdownMenuItem({
	className,
	inset,
	variant = "default",
	...props
}: MenuPrimitive.Item.Props & {
	inset?: boolean;
	variant?: "default" | "destructive";
}) {
	return (
		<MenuPrimitive.Item
			className={cn(
				"group/dropdown-menu-item relative flex cursor-default select-none items-center gap-2 whitespace-nowrap rounded-sm px-2 py-1 font-medium text-sm outline-hidden data-highlighted:data-[variant=destructive]:bg-red-100 data-highlighted:data-[variant=destructive]:text-red-700 data-disabled:pointer-events-none data-highlighted:bg-base-100 data-inset:pl-8 data-highlighted:text-base-800 data-disabled:opacity-50 not-data-[variant=destructive]:data-highlighted:**:text-base-800 [&_svg:not([class*='size-'])]:size-3.5 [&_svg:not([class*='text-'])]:text-base-500 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[variant=destructive]:[&_svg]:text-red-500 data-[variant=destructive]:*:[svg]:text-red-500",
				className,
			)}
			data-inset={inset}
			data-slot="dropdown-menu-item"
			data-variant={variant}
			{...props}
		/>
	);
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
	return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: MenuPrimitive.SubmenuTrigger.Props & {
	inset?: boolean;
}) {
	return (
		<MenuPrimitive.SubmenuTrigger
			className={cn(
				"flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1 font-medium text-sm outline-hidden data-highlighted:bg-base-100 data-open:bg-base-100 data-inset:pl-8 data-highlighted:text-base-800 data-open:text-base-800 not-data-[variant=destructive]:data-highlighted:**:text-base-700 [&_svg:not([class*='size-'])]:size-3.5 [&_svg:not([class*='text-'])]:text-base-500 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			data-inset={inset}
			data-slot="dropdown-menu-sub-trigger"
			{...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto" />
		</MenuPrimitive.SubmenuTrigger>
	);
}

function DropdownMenuSubContent({
	align = "start",
	alignOffset = -3,
	side = "right",
	sideOffset = 0,
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
	return (
		<DropdownMenuContent
			align={align}
			alignOffset={alignOffset}
			className={cn(
				"data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				"max-h-(--available-height) w-auto min-w-24 overflow-y-auto rounded-md bg-background text-base-700 shadow-lg ring-1 ring-base-700/10 duration-100",
				"data-closed:animate-out data-open:animate-in",
				className,
			)}
			data-slot="dropdown-menu-sub-content"
			side={side}
			sideOffset={sideOffset}
			{...props}
		/>
	);
}

function DropdownMenuSubSearch({
	children,
	...props
}: React.ComponentProps<typeof ComboboxPrimitive.Root>) {
	return (
		<DropdownMenuSubContent data-slot="dropdown-menu-sub-search">
			<ComboboxPrimitive.Root {...props}>{children}</ComboboxPrimitive.Root>
		</DropdownMenuSubContent>
	);
}

function DropdownMenuSubSearchInput({
	className,
	onKeyDown,
	...props
}: ComboboxPrimitive.Input.Props) {
	return (
		<div className="mx-1.5 my-1.5 mb-0.5">
			<ComboboxPrimitive.Input
				autoFocus
				className={cn(
					"w-full shrink-0 rounded-sm border border-base-200 bg-transparent px-2 py-1 text-sm outline-hidden placeholder:text-base-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-accent-500",
					className,
				)}
				data-slot="dropdown-menu-sub-search-input"
				onKeyDown={(event) => {
					// The parent Menu listens for keydown on the popup to drive its own
					// typeahead/roving-focus navigation, which would otherwise prevent
					// default on printable-character keys before they reach this input.
					event.stopPropagation();
					onKeyDown?.(event);
				}}
				{...props}
			/>
		</div>
	);
}

function DropdownMenuSubSearchEmpty({
	className,
	...props
}: ComboboxPrimitive.Empty.Props) {
	return (
		<ComboboxPrimitive.Empty
			className={cn(
				"text-center text-base-500 text-sm [&_div]:px-1.5 [&_div]:py-5 [&_div]:pb-3",
				className,
			)}
			data-slot="dropdown-menu-sub-search-empty"
			{...props}
		/>
	);
}

function DropdownMenuSubSearchList({
	className,
	...props
}: ComboboxPrimitive.List.Props) {
	return (
		<ComboboxPrimitive.List
			className={cn(
				"min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-1",
				className,
			)}
			data-slot="dropdown-menu-sub-search-list"
			{...props}
		/>
	);
}

function DropdownMenuSubSearchItem({
	className,
	children,
	checked,
	...props
}: ComboboxPrimitive.Item.Props & {
	/**
	 * Whether to render a checkmark indicator (for multiselect search lists).
	 * Omit for single-select search lists.
	 */
	checked?: boolean;
}) {
	return (
		<ComboboxPrimitive.Item
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-md py-1 pl-2 text-sm outline-hidden focus:bg-base-100 data-disabled:pointer-events-none data-highlighted:bg-base-100 data-highlighted:text-base-800 data-disabled:opacity-50 data-highlighted:**:text-base-800 [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				checked !== undefined && "pr-8",
				className,
			)}
			data-slot="dropdown-menu-sub-search-item"
			{...props}
		>
			{children}
			{checked && (
				<span
					className="pointer-events-none absolute right-2 flex items-center justify-center"
					data-slot="dropdown-menu-sub-search-item-indicator"
				>
					<CheckIcon className="size-4" />
				</span>
			)}
		</ComboboxPrimitive.Item>
	);
}

function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	...props
}: MenuPrimitive.CheckboxItem.Props) {
	return (
		<MenuPrimitive.CheckboxItem
			checked={checked}
			className={cn(
				"relative flex cursor-default select-none items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden data-[disabled]:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[disabled]:opacity-50 data-highlighted:**:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			data-slot="dropdown-menu-checkbox-item"
			{...props}
		>
			<span
				className="pointer-events-none absolute right-2 flex items-center justify-center"
				data-slot="dropdown-menu-checkbox-item-indicator"
			>
				<MenuPrimitive.CheckboxItemIndicator>
					<CheckIcon />
				</MenuPrimitive.CheckboxItemIndicator>
			</span>
			{children}
		</MenuPrimitive.CheckboxItem>
	);
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
	return (
		<MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
	);
}

function DropdownMenuRadioItem({
	className,
	children,
	...props
}: MenuPrimitive.RadioItem.Props) {
	return (
		<MenuPrimitive.RadioItem
			className={cn(
				"relative flex cursor-default select-none items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden data-[disabled]:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[disabled]:opacity-50 data-highlighted:**:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			data-slot="dropdown-menu-radio-item"
			{...props}
		>
			<span
				className="pointer-events-none pointer-events-none absolute right-2 flex items-center justify-center"
				data-slot="dropdown-menu-radio-item-indicator"
			>
				<MenuPrimitive.RadioItemIndicator>
					<CheckIcon />
				</MenuPrimitive.RadioItemIndicator>
			</span>
			{children}
		</MenuPrimitive.RadioItem>
	);
}

function DropdownMenuSeparator({
	className,
	...props
}: MenuPrimitive.Separator.Props) {
	return (
		<MenuPrimitive.Separator
			className={cn("h-px bg-base-200", className)}
			data-slot="dropdown-menu-separator"
			{...props}
		/>
	);
}

function DropdownMenuShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			className={cn(
				"ml-auto font-mono font-normal text-base-500 text-xs tracking-widest group-focus/dropdown-menu-item:text-accent-foreground",
				className,
			)}
			data-slot="dropdown-menu-shortcut"
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubSearch,
	DropdownMenuSubSearchEmpty,
	DropdownMenuSubSearchInput,
	DropdownMenuSubSearchItem,
	DropdownMenuSubSearchList,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
};

"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button";
import { Input } from "../input/input";
import { Textarea } from "../textarea";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		// biome-ignore lint/a11y/useSemanticElements: not an interactive element
		<div
			className={cn(
				"group/input-group relative flex h-7.5 w-full min-w-0 items-center rounded-md shadow-sm outline-solid outline-transparent ring-1 ring-base-700/10 transition-colors",
				// invalid
				"has-[[data-slot][aria-invalid=true]]:outline-2 has-[[data-slot][aria-invalid=true]]:outline-red-500 has-[[data-slot][aria-invalid=true]]:outline-offset-3",
				// focus
				"has-[[data-slot=input-group-control]:focus-visible]:outline-2 has-[[data-slot=input-group-control]:focus-visible]:outline-accent-500 has-[[data-slot=input-group-control]:focus-visible]:outline-offset-3",
				// combobox
				"in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0",
				// disabled
				"has-disabled:bg-background/50 has-disabled:opacity-50",
				// sizing & alignment
				"has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-start]]:h-auto has-[>textarea]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
				className,
			)}
			data-slot="input-group"
			role="group"
			{...props}
		/>
	);
}

const inputGroupAddonVariants = cva(
	"flex h-auto cursor-text select-none items-center justify-center gap-2 py-1.5 font-medium text-base-500 text-sm group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
	{
		variants: {
			align: {
				"inline-start":
					"order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
				"inline-end":
					"order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
				"block-start":
					"order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
				"block-end":
					"order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
			},
		},
		defaultVariants: {
			align: "inline-start",
		},
	},
);

function InputGroupAddon({
	className,
	align = "inline-start",
	onClick,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: click only refocuses the already keyboard-accessible sibling input, not a distinct control
		// biome-ignore lint/a11y/useSemanticElements: decorative addon wrapper, not a form fieldset
		<div
			className={cn(inputGroupAddonVariants({ align }), className)}
			data-align={align}
			data-slot="input-group-addon"
			onClick={(e) => {
				onClick?.(e);
				if ((e.target as HTMLElement).closest("button")) {
					return;
				}
				e.currentTarget.parentElement
					?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")
					?.focus();
			}}
			role="group"
			{...props}
		/>
	);
}

const inputGroupButtonVariants = cva(
	"flex items-center gap-2 text-sm shadow-none",
	{
		variants: {
			size: {
				xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
				sm: "",
				"icon-xs": "size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0",
				"icon-sm": "size-8 p-0 has-[>svg]:p-0",
			},
		},
		defaultVariants: {
			size: "xs",
		},
	},
);

function InputGroupButton({
	className,
	type = "button",
	variant = "ghost",
	size = "xs",
	...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
	VariantProps<typeof inputGroupButtonVariants> & {
		type?: "button" | "submit" | "reset";
	}) {
	return (
		<Button
			className={cn(inputGroupButtonVariants({ size }), className)}
			data-size={size}
			type={type}
			variant={variant}
			{...props}
		/>
	);
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			className={cn(
				"flex items-center gap-2 text-muted-foreground text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
				className,
			)}
			{...props}
		/>
	);
}

function InputGroupInput({
	className,
	...props
}: React.ComponentProps<"input">) {
	return (
		<Input
			className={cn(
				"flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:bg-transparent aria-invalid:outline-none dark:bg-transparent",
				className,
			)}
			data-slot="input-group-control"
			{...props}
		/>
	);
}

function InputGroupTextarea({
	className,
	...props
}: React.ComponentProps<"textarea">) {
	return (
		<Textarea
			className={cn(
				"flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:outline-none disabled:bg-transparent aria-invalid:outline-none dark:bg-transparent dark:disabled:bg-transparent",
				className,
			)}
			data-slot="input-group-control"
			{...props}
		/>
	);
}

export {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
};

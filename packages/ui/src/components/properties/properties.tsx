"use client";

import { mergeProps, useRender } from "@base-ui/react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useRef, useState } from "react";
import { cn } from "../../lib/cn";

function Properties({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div className={cn("w-96", className)} data-slot="properties" {...props} />
	);
}

function PropertiesLabel({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			className={cn("mb-4 block font-medium text-base-800 text-xs", className)}
			data-slot="properties-label"
			{...props}
		/>
	);
}

function PropertiesList({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			className={cn("grid gap-4 sm:gap-3", className)}
			data-slot="properties-list"
			{...props}
		/>
	);
}

function Property({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			className={cn("grid gap-1.5 sm:grid-cols-[10rem_1fr]", className)}
			data-slot="property"
			{...props}
		/>
	);
}

function PropertyLabel({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"flex items-center justify-start gap-2 font-medium text-base-500 text-xs sm:text-sm",
				"[&_svg:not([class*='size-'])]:size-3.5 [&_svg:not([class*='size-'])]:text-base-400 max-sm:[&_svg]:hidden",
				className,
			)}
			data-slot="property-label"
			{...props}
		/>
	);
}

function PropertyValue<T extends string | number>({
	className,
	value,
	render,
	format,
	type = "button",
	...props
}: useRender.ComponentProps<"button", { value: T }> & {
	value: T;
	format?: (value: T) => string;
}) {
	const [copied, setCopied] = useState(false);
	const resetTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const displayValue = format ? format(value) : value;

	function handleCopy() {
		navigator.clipboard.writeText(String(displayValue)).then(
			() => {
				clearTimeout(resetTimeoutRef.current);
				setCopied(true);
				resetTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
			},
			(error) => {
				console.warn("Failed to copy property value to clipboard.", error);
			},
		);
	}

	const defaultProps: useRender.ElementProps<"button"> = {
		className: cn(
			"group/property-value relative isolate flex w-fit cursor-pointer items-center justify-start gap-2 text-start text-base-800 text-sm",

			className,
		),
		children: (
			<>
				{displayValue}
				<span className="absolute inset-0 top-1/2 left-1/2 -z-10 block h-[calc(100%+0.25rem)] w-[calc(100%+1rem)] -translate-x-1/2 -translate-y-1/2 rounded-xs bg-base-200 opacity-0 transition-all group-hover/property-value:opacity-100" />
				<AnimatePresence initial={false} mode="wait">
					{copied ? (
						<motion.span
							animate={{ opacity: 1, scale: 1 }}
							className="absolute -right-4 flex size-3.5 shrink-0 translate-x-full items-center justify-center"
							exit={{ opacity: 0, scale: 0.8 }}
							initial={{ opacity: 0, scale: 0.8 }}
							key="check"
							transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
						>
							<CheckIcon className="size-3.5 text-slate-500" />
						</motion.span>
					) : (
						<motion.span
							className="absolute -right-4 flex size-3.5 shrink-0 translate-x-full items-center justify-center opacity-0 transition-opacity group-hover/property-value:opacity-100"
							key="copy"
						>
							<CopyIcon className="size-4 text-slate-500" />
						</motion.span>
					)}
				</AnimatePresence>
				<span className="sr-only" role="status">
					{copied ? "Copied" : null}
				</span>
			</>
		),
		onClick: handleCopy,
		type,
	};

	const element = useRender({
		defaultTagName: "button",
		render,
		state: { value },
		props: mergeProps<"button">(defaultProps, props),
	});

	return element;
}

export {
	Properties,
	PropertiesLabel,
	PropertiesList,
	Property,
	PropertyLabel,
	PropertyValue,
};

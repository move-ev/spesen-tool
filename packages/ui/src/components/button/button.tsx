"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
	[
		"inline-flex items-center justify-center",
		"font-medium text-sm leading-none",
		"cursor-pointer transition-colors",
		"select-none disabled:pointer-events-none disabled:opacity-60 data-disabled:opacity-60",
	],
	{
		variants: {
			variant: {
				default: [
					"bg-accent-600 text-accent-50 [&_svg:not([class*='text-'])]:text-accent-200",
					"border border-accent-600",
					"text-indigo-50 text-shadow-2xs text-shadow-indigo-800/50",
					"inset-shadow-[0_-1px_0_0_var(--color-accent-700)]",
					"hover:bg-accent-700",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
				],
				outline: [
					"border border-base-200",
					"text-base-700 [&_svg:not([class*='text-'])]:text-slate-500",
					"hover:bg-slate-50",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
				],
				ghost: [
					"text-base-700 [&_svg:not([class*='text-'])]:text-slate-500",
					"hover:bg-slate-50",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
				],
				destructive: [
					"border border-base-200",
					"text-base-700 [&_svg:not([class*='text-'])]:text-red-500",
					"hover:border-red-200 hover:bg-red-50 hover:text-red-600",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
				],
			},
			size: {
				default:
					"h-8 gap-2 rounded-md px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
				sm: "h-7 gap-2 rounded-md px-2 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-9 gap-2 rounded-md px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
				icon: "",
				"icon-sm": "",
				"icon-lg": "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	disableAnimation,
	...props
}: ButtonPrimitive.Props &
	VariantProps<typeof buttonVariants> & {
		disableAnimation?: boolean;
	}) {
	return (
		<ButtonPrimitive
			className={cn(buttonVariants({ variant, size, className }))}
			data-slot="button"
			render={
				<motion.button
					transition={{ duration: 0.1, ease: "easeOut" }}
					whileTap={{
						...(disableAnimation
							? { scale: 1 }
							: {
									scale: 0.97,
								}),
					}}
				/>
			}
			{...props}
		/>
	);
}

export { Button, buttonVariants };

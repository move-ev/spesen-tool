"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button";
import { ScrollArea } from "../scroll-area";

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
	return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
	return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
	return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
	return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
	return (
		<SheetPrimitive.Backdrop
			className={cn(
				"fixed inset-0 z-50 bg-base-900/20 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0",
				className,
			)}
			data-slot="sheet-overlay"
			{...props}
		/>
	);
}

function SheetContent({
	className,
	children,
	side = "right",
	showCloseButton = true,
	...props
}: SheetPrimitive.Popup.Props & {
	side?: "top" | "right" | "bottom" | "left";
	showCloseButton?: boolean;
}) {
	return (
		<SheetPortal>
			<SheetOverlay />
			<SheetPrimitive.Popup
				className={cn(
					"fixed z-50 flex max-h-full min-h-0 flex-col overflow-hidden bg-background bg-clip-padding text-base-600 text-sm shadow-xl ring-1 ring-base-700/10 transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0",
					// top
					"data-[side=top]:data-ending-style:-translate-y-10 data-[side=top]:data-starting-style:-translate-y-10 data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:rounded-b-lg",
					// right
					"data-[side=right]:data-ending-style:translate-x-10 data-[side=right]:data-starting-style:translate-x-10 data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-[90%] data-[side=right]:rounded-l-lg data-[side=right]:sm:max-w-lg",
					// bottom
					"data-[side=bottom]:data-ending-style:translate-y-10 data-[side=bottom]:data-starting-style:translate-y-10 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:rounded-t-lg",
					// left
					"data-[side=left]:data-ending-style:-translate-x-10 data-[side=left]:data-starting-style:-translate-x-10 data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-[90%] data-[side=left]:rounded-r-lg data-[side=left]:sm:max-w-lg",
					className,
				)}
				data-side={side}
				data-slot="sheet-content"
				{...props}
			>
				{children}
				{showCloseButton && (
					<SheetPrimitive.Close
						data-slot="sheet-close"
						render={
							<Button
								className="absolute top-3 right-3"
								size="icon-sm"
								variant="ghost"
							>
								<XIcon />
								<span className="sr-only">Close</span>
							</Button>
						}
					/>
				)}
			</SheetPrimitive.Popup>
		</SheetPortal>
	);
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex shrink-0 flex-col gap-2 border-base-200 border-b px-6 py-5",
				className,
			)}
			data-slot="sheet-header"
			{...props}
		/>
	);
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"mt-auto flex shrink-0 flex-col gap-2 border-base-300 border-t bg-base-50 p-6 py-5",
				className,
			)}
			data-slot="sheet-footer"
			{...props}
		/>
	);
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<ScrollArea data-slot="sheet-body">
			<div className={cn("px-6 py-8", className)} {...props} />
		</ScrollArea>
	);
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
	return (
		<SheetPrimitive.Title
			className={cn("font-semibold text-base-800 text-lg/6", className)}
			data-slot="sheet-title"
			{...props}
		/>
	);
}

function SheetDescription({
	className,
	...props
}: SheetPrimitive.Description.Props) {
	return (
		<SheetPrimitive.Description
			className={cn("text-base-500 text-sm/5", className)}
			data-slot="sheet-description"
			{...props}
		/>
	);
}

export {
	Sheet,
	SheetBody,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
};

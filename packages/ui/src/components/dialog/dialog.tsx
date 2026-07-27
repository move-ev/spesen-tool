"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type * as React from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button";
import { ScrollArea } from "../scroll-area";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function DialogOverlay({
	className,
	...props
}: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			className={cn(
				"data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-base-900/20 duration-100 data-closed:animate-out data-open:animate-in",
				className,
			)}
			data-slot="alert-dialog-overlay"
			{...props}
		/>
	);
}

function DialogContent({
	className,
	size = "default",
	...props
}: DialogPrimitive.Popup.Props & {
	size?: "default" | "sm";
}) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Viewport
				className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-6"
				data-slot="alert-dialog-viewport"
			>
				<DialogPrimitive.Popup
					className={cn(
						"group/alert-dialog-content data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 relative flex max-h-full min-h-0 w-full flex-col rounded-lg bg-background text-base-600 shadow-lg outline-none ring-1 ring-base-700/10 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-closed:animate-out data-open:animate-in data-[size=default]:sm:max-w-md",
						className,
					)}
					data-size={size}
					data-slot="alert-dialog-content"
					{...props}
				/>
			</DialogPrimitive.Viewport>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("grid shrink-0 gap-2 px-6 py-5", className)}
			data-slot="alert-dialog-header"
			{...props}
		/>
	);
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<ScrollArea
			className="min-h-0 flex-auto border-base-200 border-t"
			data-slot="alert-dialog-body"
		>
			<div className={cn("px-6 py-8", className)} {...props} />
		</ScrollArea>
	);
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex shrink-0 flex-col-reverse gap-2 rounded-b-xl border-base-300 border-t bg-base-50 px-6 py-5 sm:flex-row sm:justify-end",
				className,
			)}
			data-slot="alert-dialog-footer"
			{...props}
		/>
	);
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn("font-semibold text-base-800 text-lg/6", className)}
			data-slot="alert-dialog-title"
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={cn(
				"text-balance text-base-500 text-sm/5 md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
				className,
			)}
			data-slot="alert-dialog-description"
			{...props}
		/>
	);
}

function DialogAction({
	className,
	...props
}: React.ComponentProps<typeof Button>) {
	return (
		<Button
			className={cn(className)}
			data-slot="alert-dialog-action"
			{...props}
		/>
	);
}

function DialogCancel({
	className,
	variant = "outline",
	size = "default",
	...props
}: DialogPrimitive.Close.Props &
	Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
	return (
		<DialogPrimitive.Close
			className={cn(className)}
			data-slot="alert-dialog-cancel"
			render={<Button size={size} variant={variant} />}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogAction,
	DialogBody,
	DialogCancel,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};

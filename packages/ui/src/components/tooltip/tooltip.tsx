"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../lib/cn";

function TooltipProvider({
	delay = 0,
	...props
}: TooltipPrimitive.Provider.Props) {
	return (
		<TooltipPrimitive.Provider
			data-slot="tooltip-provider"
			delay={delay}
			{...props}
		/>
	);
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
	return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
	className,
	side = "top",
	sideOffset = 12,
	align = "center",
	alignOffset = 0,
	children,
	variant = "default",
	disableArrow = true,
	...props
}: TooltipPrimitive.Popup.Props &
	Pick<
		TooltipPrimitive.Positioner.Props,
		"align" | "alignOffset" | "side" | "sideOffset"
	> & {
		variant?: "default" | "dark";
		disableArrow?: boolean;
	}) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				className="isolate z-50"
				side={side}
				sideOffset={sideOffset}
			>
				<TooltipPrimitive.Popup
					className={cn(
						"group/tooltip z-50 inline-flex w-fit max-w-sm origin-(--transform-origin) items-center gap-1.5 rounded-sm bg-background px-3 py-2 text-base-700 text-sm shadow-sm ring-1 ring-base-700/10",
						// kbd
						"has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
						// top
						"data-[side=top]:slide-in-from-bottom-2",
						// right
						"data-[side=right]:slide-in-from-left-2",
						// bottom
						"data-[side=bottom]:slide-in-from-top-2",
						// left
						"data-[side=left]:slide-in-from-right-2",
						// inline-end
						"data-[side=inline-end]:slide-in-from-left-2",
						// inline-start
						"data-[side=inline-start]:slide-in-from-right-2",
						// animations
						"data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 data-[state=delayed-open]:animate-in data-closed:animate-out data-open:animate-in",
						className,
					)}
					data-slot="tooltip-content"
					data-variant={variant}
					{...props}
				>
					{children}
					<TooltipPrimitive.Arrow
						className={cn(
							disableArrow && "hidden",
							"z-50 size-3.5 rounded-xs fill-background fill-foreground text-base-400",
							// top
							"data-[side=top]:-bottom-3.5",
							// right
							"data-[side=right]:top-1/2! data-[side=right]:-left-3.5 data-[side=right]:-translate-y-1/2 data-[side=right]:rotate-90",
							// bottom
							"data-[side=bottom]:-top-3.5 data-[side=bottom]:rotate-180",
							// left
							"data-[side=left]:top-1/2! data-[side=left]:-right-3.5 data-[side=left]:-translate-y-1/2 data-[side=left]:-rotate-90",
							// inline-end
							"data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-3.5 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-end]:rotate-90",
							// inline-start
							"data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-3.5 data-[side=inline-start]:-translate-y-1/2 data-[side=inline-start]:-rotate-90",
						)}
						render={<ChevronDownIcon />}
					/>
				</TooltipPrimitive.Popup>
			</TooltipPrimitive.Positioner>
		</TooltipPrimitive.Portal>
	);
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

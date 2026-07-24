"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "../../lib/cn";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
	return (
		<SwitchPrimitive.Root
			className={cn(
				"peer group/switch relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full shadow-sm outline-none outline-2 outline-transparent outline-offset-3 ring-1 ring-base-700/10 transition-all",
				// after
				// "after:absolute after:-inset-x-3 after:-inset-y-2",
				// focus
				"focus-visible:outline-accent-500 focus-visible:outline-solid",
				// invalid
				"aria-invalid:outline-red-500 aria-invalid:outline-solid",
				// disabled
				"data-disabled:cursor-not-allowed data-disabled:opacity-50",
				// checked
				"data-checked:bg-accent-600",
				// unchecked
				"data-unchecked:bg-base-50",
				className,
			)}
			data-slot="switch"
			{...props}
		>
			<SwitchPrimitive.Thumb
				className="pointer-events-none block size-4 rounded-full bg-base-500 ring-0 transition-transform data-checked:translate-x-4.5 data-unchecked:translate-x-0.5 data-checked:bg-white"
				data-slot="switch-thumb"
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };

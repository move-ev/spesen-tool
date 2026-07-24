"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";
import { cn } from "../../lib/cn";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
	return (
		<CheckboxPrimitive.Root
			className={cn(
				"peer sm relative flex size-4 shrink-0 items-center justify-center rounded-xs shadow-sm outline-none outline-transparent outline-offset-3 ring-1 ring-base-700/10 transition-colors",
				// after
				"after:absolute after:-inset-x-3 after:-inset-y-2",
				// focus
				"focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-solid",
				// disabled
				"disabled:cursor-not-allowed disabled:opacity-50 group-has-disabled/field:opacity-50",
				// invalid
				"aria-invalid:outline-2 aria-invalid:outline-red-500 aria-invalid:outline-solid",
				// checked
				"data-checked:bg-accent-600 data-checked:text-white data-checked:shadow-accent-600/30 data-checked:ring-accent-600",
				"data-indeterminate:bg-accent-600 data-indeterminate:text-white data-indeterminate:shadow-accent-600/30 data-indeterminate:ring-accent-600",
				className,
			)}
			data-slot="checkbox"
			{...props}
		>
			<CheckboxPrimitive.Indicator
				className="group/indicator grid place-content-center text-current transition-none [&>svg]:size-3.5"
				data-slot="checkbox-indicator"
			>
				<CheckIcon className="block group-data-indeterminate/indicator:hidden" />
				<MinusIcon className="hidden group-data-indeterminate/indicator:block" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };

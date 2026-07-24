import type * as React from "react";
import { cn } from "../../lib/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			className={cn(
				"field-sizing-content flex min-h-16 w-full rounded-md bg-background px-2.5 py-2 font-medium text-base-800 text-sm shadow-sm outline-none outline-transparent ring-1 ring-base-700/10 transition-colors placeholder:text-base-500",
				"disabled:cursor-not-allowed disabled:select-none disabled:bg-background disabled:opacity-50",
				"focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-solid focus-visible:outline-offset-3",
				"aria-invalid:outline-2 aria-invalid:outline-red-500 aria-invalid:outline-solid aria-invalid:outline-offset-3",
				className,
			)}
			data-slot="textarea"
			{...props}
		/>
	);
}

export { Textarea };

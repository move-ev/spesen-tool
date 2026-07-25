import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "../../lib/cn";

function Input({ className, type, ...props }: InputPrimitive.Props) {
	return (
		<InputPrimitive
			className={cn(
				"h-7.5 w-full min-w-0 rounded-md bg-transparent px-2.5 py-1 font-medium text-base-800 text-sm shadow-sm outline-none outline-transparent ring-1 ring-base-700/10 transition-colors",
				"file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-base-800 file:text-sm",
				"placeholder:text-base-500",
				"disabled:cursor-not-allowed disabled:select-none disabled:bg-background disabled:opacity-50",
				"aria-invalid:outline-2 aria-invalid:outline-red-500 aria-invalid:outline-solid aria-invalid:outline-offset-3",
				"focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-solid focus-visible:outline-offset-3",
				className,
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}

export { Input };

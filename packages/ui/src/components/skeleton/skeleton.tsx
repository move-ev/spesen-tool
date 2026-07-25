import { cn } from "../../lib/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-base-100", className)}
			data-slot="skeleton"
			{...props}
		/>
	);
}

export { Skeleton };

import LinkPrimitive from "next/link";
import type React from "react";
import { cn } from "@/lib/utils";

export function Link({
	className,
	...props
}: React.ComponentProps<typeof LinkPrimitive>) {
	return (
		<LinkPrimitive
			className={cn(
				"inline-flex items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				className,
			)}
			{...props}
		/>
	);
}

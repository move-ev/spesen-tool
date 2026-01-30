import type React from "react";
import { cn } from "@/lib/utils";

export function Shell({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("py-12", className)} data-slot="shell" {...props} />;
}

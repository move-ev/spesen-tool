import { Skeleton } from "@zemio/ui";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { AdminNavbar } from "./admin-navbar";
import { AdminReportsGrid } from "./admin-reports-grid";

function AdminContent({ className, ...props }: React.ComponentProps<"main">) {
	return (
		<main className={cn(className)} data-slot="admin-content" {...props}>
			<AdminNavbar />
			<Suspense
				fallback={
					<div className="container space-y-2 pt-5 pb-16">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				}
			>
				<AdminReportsGrid className="pt-5 pb-16" />
			</Suspense>
		</main>
	);
}

export { AdminContent };

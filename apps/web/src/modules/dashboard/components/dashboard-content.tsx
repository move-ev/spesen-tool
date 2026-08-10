"use client";

import { cn } from "@/lib/utils";
import { DashboardNavbar } from "./dashboard-navbar";
import { DashboardReportList } from "./dashboard-report-list";
import { DashboardStats } from "./dashboard-stats";

function DashboardContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("", className)} data-slot="dashboard-content" {...props}>
			<DashboardNavbar />
			<main className="py-12">
				<section className="container">
					<DashboardStats />
				</section>
				<section className="container mt-20">
					<DashboardReportList />
				</section>
			</main>
		</div>
	);
}

export { DashboardContent };

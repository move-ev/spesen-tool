"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Skeleton,
} from "@zemio/ui";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

function ReportNavbar({
	className,
	reportId,
	...props
}: React.ComponentProps<typeof Navbar> & {
	reportId: string;
}) {
	const query = api.report.byId.useQuery({ id: reportId });

	return (
		<Navbar className={cn("", className)} data-slot="report-navbar" {...props}>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>Reports</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>
							{query.isPending ? (
								<Skeleton className="h-4 w-6" />
							) : query.error ? null : (
								query.data.tag
							)}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		</Navbar>
	);
}

export { ReportNavbar };

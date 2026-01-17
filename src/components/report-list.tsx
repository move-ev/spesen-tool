import { format } from "date-fns";
import type { Report } from "generated/prisma/client";
import Link from "next/link";
import type React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

export function ReportList({
	reports,
	reportRoute,
	className,
	...props
}: React.ComponentProps<"ul"> & {
	reports: Report[];

	/**
	 * The route to the report details page. `:reportId` will be replaced
	 * with the actual report id.
	 */
	reportRoute: string;
}) {
	return (
		<ul className={cn("grid gap-2", className)} {...props}>
			{reports.map((report, index) => (
				<>
					<li
						className="relative isolate rounded-md px-4 py-2 hover:bg-muted"
						key={report.id}
					>
						<div>
							<Link
								className="group/list-item focus:outline-0"
								href={reportRoute.replace(":reportId", report.id)}
							>
								<span
									className={cn(
										"absolute inset-0 z-50 h-full w-full rounded-md transition-colors",
										"group-focus/list-item:ring-2 group-focus/list-item:ring-ring group-focus/list-item:ring-offset-4",
									)}
								/>
								<p className="font-medium">{report.title}</p>
							</Link>
							<p className="text-muted-foreground text-sm">
								Erstellt am {format(report.createdAt, "dd.MM.yyyy")} um{" "}
								{format(report.createdAt, "HH:mm")} Uhr
							</p>
						</div>
					</li>
					{index !== reports.length - 1 && <Separator className={cn("mx-4")} />}
				</>
			))}
		</ul>
	);
}

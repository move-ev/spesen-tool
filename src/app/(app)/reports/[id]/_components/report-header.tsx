"use client";

import { format } from "date-fns";
import { CheckIcon, ClockIcon } from "lucide-react";
import { PageDescription, PageTitle } from "@/components/page-title";
import { ReportStatusBadge } from "@/components/report-status-badge";
import { Button } from "@/components/ui/button";
import { ReportStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export function ReportHeader({
	className,
	reportId,
	...props
}: React.ComponentProps<"header"> & { reportId: string }) {
	const [report] = api.report.getById.useSuspenseQuery({ id: reportId });

	return (
		<header
			className={cn(
				"flex flex-col flex-wrap items-start justify-between gap-6 sm:flex-row",
				className,
			)}
			data-slot="report-header"
			{...props}
		>
			<div>
				<div className="flex items-center justify-start gap-4">
					<PageTitle>{report.title}</PageTitle>
					<ReportStatusBadge status={report.status} />
				</div>
				<PageDescription className="mt-2">
					Erstellt am {format(report.createdAt, "dd.MM.yyyy")} um{" "}
					{format(report.createdAt, "HH:mm")} Uhr von{" "}
					<span className="font-medium text-foreground">{report.owner.name}</span>
				</PageDescription>
			</div>

			{report.status === ReportStatus.DRAFT ||
			report.status === ReportStatus.NEEDS_REVISION ? (
				<Button className={"w-full sm:w-fit"} variant={"default"}>
					Einreichen
					<CheckIcon />
				</Button>
			) : (
				<Button className={"w-full sm:w-fit"} disabled variant={"outline"}>
					Eingereicht
					<ClockIcon />
				</Button>
			)}
		</header>
	);
}

"use client";

import { format } from "date-fns";
import { CheckIcon, ShieldUserIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { PageDescription, PageTitle } from "@/components/page-title";
import { ReportStatusBadge } from "@/components/report-status-badge";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { Report, User } from "@/generated/prisma/client";
import { ADMINS_UPDATE_OWN_REPORT } from "@/lib/flags";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";
import { ReportAdministration } from "./report-administration";

export function ReportHeader({
	className,
	report,
	...props
}: React.ComponentProps<"header"> & {
	report: Report & { owner: Pick<User, "id" | "name" | "email"> };
}) {
	const utils = api.useUtils();
	// const [report] = api.report.getById.useSuspenseQuery({ id: reportId });
	const { data, isPending } = authClient.useSession();

	const handleSubmit = api.report.submit.useMutation({
		onSuccess: () => {
			toast.success("Report eingereicht");
			utils.report.getById.invalidate({ id: report.id });
		},
		onError: ({ message }) => {
			toast.error("Fehler beim Einreichen des Reports", {
				description: message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	const canAdministrate = React.useMemo(() => {
		if (isPending) return false;

		// Drafts cannot be administrated
		if (report.status === "DRAFT") return false;

		const isOwner = data?.user?.id === report.ownerId;
		const isAdmin = data?.user?.role === "admin";

		// Check if admins can update their own reports
		if (ADMINS_UPDATE_OWN_REPORT && isAdmin && isOwner) return true;

		// Admins can update other reports
		if (isAdmin && !isOwner) return true;

		// Users cannot update other reports
		if (!isAdmin && !isOwner) return false;

		return false;
	}, [data, report, isPending]);

	return (
		<header
			className={cn(
				"flex flex-col flex-wrap items-start justify-start gap-6 sm:flex-row",
				className,
			)}
			data-slot="report-header"
			{...props}
		>
			<div className="me-auto">
				<div className="flex flex-wrap-reverse items-center justify-start gap-4">
					<PageTitle>
						<span className="me-2 text-muted-foreground">#{report.tag}</span>
						{report.title}
					</PageTitle>
					<ReportStatusBadge status={report.status} />
				</div>
				<PageDescription className="mt-2">
					Erstellt am {format(report.createdAt, "dd.MM.yyyy")} um{" "}
					{format(report.createdAt, "HH:mm")} Uhr von{" "}
					<span className="font-medium text-foreground">{report.owner.name}</span>
				</PageDescription>
			</div>

			<div className="flex w-full flex-wrap items-center justify-start gap-4 sm:w-fit">
				{canAdministrate && (
					<ReportAdministration
						className="w-full sm:w-fit"
						report={report}
						variant={"outline"}
					>
						<ShieldUserIcon /> Administrieren
						<KbdGroup className="hidden sm:inline-flex">
							<Kbd>⌘</Kbd>+ <Kbd>B</Kbd>
						</KbdGroup>
					</ReportAdministration>
				)}

				<Button
					className={"w-full sm:w-fit"}
					disabled={
						handleSubmit.isPending ||
						(report.status !== "DRAFT" && report.status !== "NEEDS_REVISION")
					}
					onClick={() => handleSubmit.mutate({ id: report.id })}
					variant={"default"}
				>
					{handleSubmit.isPending ? (
						"Wird eingereicht..."
					) : (
						<>
							Einreichen
							<CheckIcon />
						</>
					)}
				</Button>
			</div>
		</header>
	);
}

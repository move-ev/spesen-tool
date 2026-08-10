"use client";

import type { ReportStatus } from "@zemio/db";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@zemio/ui";
import { FileIcon, SheetIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { StatusIcons } from "@/lib/icons";
import { canAdminTransition } from "@/lib/report-transitions";
import { api } from "@/trpc/react";
import type { ReviewReport } from "./review-types";

/**
 * Status overrides offered by the actions menu, in display order. Whether each
 * one is reachable comes from `canAdminTransition`, so the menu never offers a
 * change the server would reject — a PAID report has no valid target at all.
 */
const STATUS_ACTIONS = [
	{ status: "ACCEPTED", labelKey: "acceptAction" },
	{ status: "REJECTED", labelKey: "rejectAction" },
	{ status: "NEEDS_REVISION", labelKey: "needsRevisionAction" },
	{ status: "PENDING_APPROVAL", labelKey: "pendingApprovalAction" },
] as const satisfies readonly { status: ReportStatus; labelKey: string }[];

function ReviewActions({
	report,
	...props
}: React.ComponentProps<typeof Button> & {
	report: Pick<ReviewReport, "id" | "status">;
}) {
	const tHeader = useTranslations("modules.review.header");
	const utils = api.useUtils();

	const { mutate: setStatus } = api.report.transition.useMutation({
		onMutate: () => {
			toast.info(tHeader("statusUpdating"));
		},
		onSuccess: () => {
			toast.success(tHeader("statusUpdated"));
			void utils.report.review.invalidate({ id: report.id });
			// The transition appends a report.status_changed audit row, so the
			// activity feed stays stale until this is refetched.
			void utils.audit.history.invalidate({ id: report.id });
		},
		onError: () => {
			toast.error(tHeader("statusUpdateError"));
		},
	});

	const updateStatus = (status: ReportStatus) => {
		setStatus({
			id: report.id,
			status,
			notify:
				status === "NEEDS_REVISION" ||
				status === "ACCEPTED" ||
				status === "REJECTED",
		});
	};

	const createSummaryPdf = api.report.exportToPdf.useMutation({
		onMutate: () => {
			toast.info(tHeader("pdfGeneratingTitle"), {
				description: tHeader("pdfGeneratingDescription"),
			});
		},
		onSuccess: (data) => {
			window.open(data.url, "_blank");
			toast.success(tHeader("pdfGeneratedTitle"), {
				description: tHeader("pdfGeneratedDescription"),
			});
		},
		onError: ({ message }) => {
			toast.error(tHeader("pdfGenerationErrorTitle"), {
				description: message ?? tHeader("unexpectedError"),
			});
		},
	});

	return (
		<DropdownMenu data-slot="report-actions">
			<DropdownMenuTrigger render={<Button variant={"outline"} {...props} />} />
			<DropdownMenuContent align="end" className={"w-64"}>
				<DropdownMenuGroup>
					<DropdownMenuLabel>{tHeader("changeStatusLabel")}</DropdownMenuLabel>
					{STATUS_ACTIONS.map(({ status, labelKey }) => {
						const Icon = StatusIcons[status];

						return (
							<DropdownMenuItem
								disabled={!canAdminTransition(report.status, status)}
								key={status}
								onClick={() => {
									updateStatus(status);
								}}
							>
								<Icon /> {tHeader(labelKey)}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuLabel>{tHeader("exportAction")}</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={() => createSummaryPdf.mutate({ id: report.id })}
					>
						<FileIcon /> {tHeader("exportPdfAction")}
					</DropdownMenuItem>
					<DropdownMenuItem disabled>
						<SheetIcon /> {tHeader("exportCsvAction")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem disabled variant="destructive">
						<TrashIcon /> {tHeader("deleteReportAction")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { ReviewActions };

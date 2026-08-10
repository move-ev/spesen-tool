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
import { api } from "@/trpc/react";
import type { ReviewReport } from "./review-types";

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
					<DropdownMenuItem
						disabled={report.status === "ACCEPTED"}
						onClick={() => {
							updateStatus("ACCEPTED");
						}}
					>
						<StatusIcons.ACCEPTED /> {tHeader("acceptAction")}
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={report.status === "REJECTED"}
						onClick={() => {
							updateStatus("REJECTED");
						}}
					>
						<StatusIcons.REJECTED /> {tHeader("rejectAction")}
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={report.status === "NEEDS_REVISION"}
						onClick={() => {
							updateStatus("NEEDS_REVISION");
						}}
					>
						<StatusIcons.NEEDS_REVISION /> {tHeader("needsRevisionAction")}
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={report.status === "PENDING_APPROVAL"}
						onClick={() => {
							updateStatus("PENDING_APPROVAL");
						}}
					>
						<StatusIcons.PENDING_APPROVAL /> {tHeader("pendingApprovalAction")}
					</DropdownMenuItem>
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

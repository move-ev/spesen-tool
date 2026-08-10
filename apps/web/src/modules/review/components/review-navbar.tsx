import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import type { ReportStatus } from "@zemio/db";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Skeleton,
} from "@zemio/ui";
import {
	BanknoteArrowDownIcon,
	ChevronDownIcon,
	CreditCardIcon,
	EllipsisIcon,
	EuroIcon,
	FileIcon,
	LandmarkIcon,
	type LucideIcon,
	SheetIcon,
	TagIcon,
	TextIcon,
	TrashIcon,
	TriangleAlertIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { StatusIcons } from "@/lib/icons";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { generateEPCCode } from "../lib/epc-code";
import type { ReviewReport } from "./review-types";

function ReviewNavbar({
	className,
	reportId,
	...props
}: React.ComponentProps<typeof Navbar> & { reportId: string }) {
	const t = useTranslations("modules.review.navbar");
	const tHeader = useTranslations("modules.review.header");

	const query = api.report.review.useQuery({
		id: reportId,
	});

	if (query.isPending) {
		return (
			<Navbar className={cn(className)} data-slot="review-navbar" {...props}>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>{t("breadcrumb")}</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								render={
									<Link href={ROUTES.ADMIN_REVIEW_OVERVIEW()}>
										{t("breadcrumbReports")}
									</Link>
								}
							/>
						</BreadcrumbItem>

						<BreadcrumbSeparator />
						<Skeleton className="h-4 w-8" />
					</BreadcrumbList>
				</Breadcrumb>
			</Navbar>
		);
	}

	if (query.error) {
		return (
			<Navbar className={cn(className)} data-slot="review-navbar" {...props} />
		);
	}

	const { data: review } = query;

	return (
		<Navbar className={cn(className)} data-slot="review-navbar" {...props}>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>{t("breadcrumb")}</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href={ROUTES.ADMIN_REVIEW_OVERVIEW()}>
							{t("breadcrumbReports")}
						</BreadcrumbLink>
					</BreadcrumbItem>

					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>#{review.report.tag}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<CopyMenu
				className={"ml-3"}
				options={[
					{
						icon: TagIcon,
						title: t("copyIdAction"),
						value: review.report.tag.toString(),
					},
					{
						icon: TextIcon,
						title: t("copyTitleAction"),
						value: review.report.title,
					},
					{
						icon: EuroIcon,
						title: t("copyAmountAction"),
						value: review.totalAmount.toFixed(2).toString(),
					},
					{
						icon: CreditCardIcon,
						title: t("copyIbanAction"),
						value: review.bankingSummary?.iban ?? "",
					},
					{
						icon: LandmarkIcon,
						title: t("copyAccountNameAction"),
						value: review.bankingSummary?.ownerName ?? "",
					},
				]}
			/>
			<div className="ml-auto flex items-center justify-center gap-2">
				<ReportActions disableAnimation report={review.report} size="sm">
					{tHeader("editAction")}
					<ChevronDownIcon />
				</ReportActions>

				<ReportPay
					disableAnimation
					disabled={
						review.report.status !== "ACCEPTED" &&
						review.report.status !== "PENDING_APPROVAL"
					}
					reportId={reportId}
					size="sm"
				>
					<BanknoteArrowDownIcon /> {tHeader("payAction")}
				</ReportPay>
			</div>
		</Navbar>
	);
}

function CopyMenu({
	options,
	...props
}: React.ComponentProps<typeof Button> & {
	options: { icon: LucideIcon; title: string; value: string }[];
}) {
	return (
		<DropdownMenu data-slot="copy-menu">
			<DropdownMenuTrigger
				render={
					<Button size={"icon-sm"} variant={"ghost"} {...props}>
						<EllipsisIcon />
					</Button>
				}
			/>
			<DropdownMenuContent className={"min-w-fit"}>
				<DropdownMenuGroup>
					{options.map(({ icon: Icon, ...option }) => (
						<DropdownMenuItem
							key={option.title}
							onClick={() => {
								navigator.clipboard.writeText(option.value);
							}}
						>
							<Icon />
							{option.title}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function ReportActions({
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

function ReportPay({
	reportId,
	...props
}: React.ComponentProps<typeof Button> & {
	reportId: string;
}) {
	const tHeader = useTranslations("modules.review.header");
	const utils = api.useUtils();

	const [financialQuery, reportQuery] = useQueries({
		queries: [
			utils.report.financialSummary.queryOptions({ id: reportId }),
			utils.report.review.queryOptions({ id: reportId }),
		],
	});

	const { mutate: setStatus, isPending: isUpdatingStatus } =
		api.report.transition.useMutation({
			onMutate: () => {
				toast.info(tHeader("statusUpdating"));
			},
			onSuccess: () => {
				toast.success(tHeader("statusUpdated"));
				void utils.report.review.invalidate({ id: reportId });
				void utils.report.financialSummary.invalidate({ id: reportId });
			},
			onError: () => {
				toast.error(tHeader("statusUpdateError"));
			},
		});

	if (financialQuery.isPending || reportQuery.isPending) {
		return <Button {...props} disabled />;
	}

	return (
		<Dialog data-slot="report-pay">
			<DialogTrigger render={<Button {...props} />} />
			<DialogContent className={"sm:max-w-lg"}>
				<DialogHeader>
					<DialogTitle>{tHeader("payDialogTitle")}</DialogTitle>
					<DialogDescription>{tHeader("payDialogDescription")}</DialogDescription>
				</DialogHeader>
				<DialogBody>
					{financialQuery.error || reportQuery.error ? (
						<ReportEPCCodeError />
					) : (
						<Suspense fallback={<ReportEPCCodeLoading />}>
							<ErrorBoundary fallbackRender={(_error) => <ReportEPCCodeError />}>
								<div>
									<p className="mb-2 font-semibold text-slate-800">
										{tHeader("giroCodeLabel")}
									</p>
									<div className="w-full max-w-32">
										<ReportEPCCode
											config={{
												amount: financialQuery.data.totalAmount,
												iban: financialQuery.data.iban ?? "",
												name: financialQuery.data.ownerName ?? "",
												tag: reportQuery.data.report.tag,
											}}
										/>
									</div>
									<p className="mt-2 text-muted-foreground text-xs">
										{tHeader("giroCodeHint")}
									</p>
								</div>
							</ErrorBoundary>
						</Suspense>
					)}
				</DialogBody>

				<DialogFooter className="sm:flex-col">
					<Button
						disabled={
							isUpdatingStatus ||
							!reportQuery.data ||
							reportQuery.data.report.status === "ACCEPTED"
						}
						onClick={() => {
							setStatus({ id: reportId, status: "ACCEPTED", notify: true });
						}}
						variant={"outline"}
					>
						{tHeader("markAcceptedAction")}
						<StatusIcons.ACCEPTED />
					</Button>
					<Button
						disabled={isUpdatingStatus || !reportQuery.data}
						onClick={() => {
							setStatus({ id: reportId, status: "PAID", notify: true });
						}}
					>
						{tHeader("markPaidAction")}
						<StatusIcons.PAID />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function ReportEPCCode({
	config,
	className,
	...props
}: React.ComponentProps<"div"> & {
	config: {
		iban: string;
		amount: number;
		name: string;
		tag: number;
	};
}) {
	const utils = api.useUtils();

	const { data: epcCode } = useSuspenseQuery({
		queryKey: [
			"report-epc-code",
			config.iban,
			config.amount,
			config.name,
			config.tag,
		],
		queryFn: () => {
			if (config.iban.trim() === "" || config.name.trim() === "") {
				return "no-image";
			}

			return generateEPCCode({
				...config,
				tag: config.tag.toString(),
				validateIban: (iban) =>
					utils.client.bankingDetails.validateIban.query({ iban }),
			});
		},
		staleTime: Number.POSITIVE_INFINITY,
		retry: 1,
	});

	if (!epcCode || epcCode === "") {
		throw new Error("Unable to generate EPC QRCode");
	}

	return (
		<div className={cn("", className)} data-slot="report-epc-code" {...props}>
			<Image alt="EPC QR Code" height={1024} src={epcCode} width={1024} />
		</div>
	);
}

function ReportEPCCodeLoading({
	className,
	...props
}: React.ComponentProps<typeof Skeleton>) {
	return (
		<Skeleton
			className={cn("aspect-square w-full", className)}
			data-slot="epc-code-loading"
			{...props}
		/>
	);
}

function ReportEPCCodeError({
	className,
	message,
	...props
}: React.ComponentProps<"div"> & {
	message?: string;
}) {
	const tHeader = useTranslations("modules.review.header");

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-sm bg-zinc-50 px-4 py-6",
				className,
			)}
			data-slot="epc-code-error"
			{...props}
		>
			<TriangleAlertIcon className="mb-4 size-5 text-amber-500" />
			<p className="text-center font-medium text-sm text-zinc-800">
				{tHeader("epcCodeErrorTitle")}
			</p>
			<p className="mt-0.5 text-center text-muted-foreground text-xs">
				{tHeader("epcCodeErrorDescription")}
			</p>
		</div>
	);
}

export { ReviewNavbar };

"use client";

import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import {
	Button,
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Skeleton,
} from "@zemio/ui";
import { TriangleAlertIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { StatusIcons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { generateEPCCode } from "../lib/epc-code";

function ReviewPay({
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

export { ReviewPay };

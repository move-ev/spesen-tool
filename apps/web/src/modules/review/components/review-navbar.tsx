"use client";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Skeleton,
} from "@zemio/ui";
import {
	BanknoteArrowDownIcon,
	ChevronDownIcon,
	CreditCardIcon,
	EllipsisIcon,
	EuroIcon,
	LandmarkIcon,
	type LucideIcon,
	TagIcon,
	TextIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ReviewActions } from "./review-actions";
import { ReviewPay } from "./review-pay";

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
			<div className="ml-auto hidden items-center justify-center gap-2 sm:flex">
				<ReviewActions disableAnimation report={review.report} size="sm">
					{tHeader("editAction")}
					<ChevronDownIcon />
				</ReviewActions>

				<ReviewPay
					disableAnimation
					disabled={
						review.report.status !== "ACCEPTED" &&
						review.report.status !== "PENDING_APPROVAL"
					}
					reportId={reportId}
					size="sm"
				>
					<BanknoteArrowDownIcon /> {tHeader("payAction")}
				</ReviewPay>
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

export { ReviewNavbar };

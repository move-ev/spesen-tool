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
import { toast } from "sonner";
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
	const t = useTranslations("modules.review.navbar");

	const copy = (title: string, value: string) => {
		navigator.clipboard.writeText(value).then(
			() => {
				toast.success(t("copiedToClipboard", { title }));
			},
			() => {
				// Rejects when the Clipboard API is unavailable (a non-secure context)
				// or permission is denied. Silence would look like a successful copy.
				toast.error(t("copyFailed"));
			},
		);
	};

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
						// Nothing to put on the clipboard when the report carries no
						// banking snapshot, and reporting success would be a lie.
						<DropdownMenuItem
							disabled={option.value === ""}
							key={option.title}
							onClick={() => {
								copy(option.title, option.value);
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

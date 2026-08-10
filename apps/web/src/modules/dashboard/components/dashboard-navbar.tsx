import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	Button,
	SheetTrigger,
} from "@zemio/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";
import { CreateReport } from "@/modules/report";

function DashboardNavbar({
	className,
	...props
}: React.ComponentProps<typeof Navbar>) {
	const t = useTranslations("modules.dashboard");

	return (
		<Navbar className={cn("", className)} data-slot="dashboard-navbar" {...props}>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>{t("header.title")}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="ml-auto">
				<CreateReport>
					<SheetTrigger
						render={
							<Button size={"sm"}>
								<PlusIcon /> {t("header.newReport")}
							</Button>
						}
					/>
				</CreateReport>
			</div>
		</Navbar>
	);
}

export { DashboardNavbar };

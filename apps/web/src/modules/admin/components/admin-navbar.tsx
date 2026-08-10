import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	SheetTrigger,
} from "@zemio/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";
import { CreateReport } from "@/modules/report";

function AdminNavbar({
	className,
	...props
}: React.ComponentProps<typeof Navbar>) {
	const t = useTranslations("modules.admin.navbar");

	return (
		<Navbar className={cn(className)} data-slot="admin-navbar" {...props}>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>{t("breadcrumb")}</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{t("breadcrumbReports")}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="ml-auto">
				<CreateReport>
					<SheetTrigger
						render={
							<Button size={"sm"}>
								<PlusIcon /> {t("newReport")}
							</Button>
						}
					/>
				</CreateReport>
			</div>
		</Navbar>
	);
}

export { AdminNavbar };

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@zemio/ui";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";

function ReportsNavbar({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<Navbar className={cn("", className)} data-slot="reports-navbar" {...props}>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>Reports</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		</Navbar>
	);
}

export { ReportsNavbar };

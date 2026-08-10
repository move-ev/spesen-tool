import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@zemio/ui";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";

function ReportingNavbar({
	className,
	...props
}: React.ComponentProps<typeof Navbar>) {
	return (
		<Navbar className={cn("", className)} data-slot="reporting-navbar" {...props}>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>Admin</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Reporting</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		</Navbar>
	);
}

export { ReportingNavbar };

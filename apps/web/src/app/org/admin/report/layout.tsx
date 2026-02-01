import { SidebarProvider } from "@zemio/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default async function ReportLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<AppSidebar />

			<div className="flex-1">
				<SiteHeader />
				{children}
			</div>
		</SidebarProvider>
	);
}

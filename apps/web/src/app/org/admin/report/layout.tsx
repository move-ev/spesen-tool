import { SidebarProvider } from "@zemio/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function ReportLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<AppSidebar />

			<div className="flex-1">{children}</div>
		</SidebarProvider>
	);
}

import { SidebarProvider } from "@/components/ui/sidebar";
import { OrganizationSettingsSidebar } from "./org-settings-sidebar";

export default async function ServerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<OrganizationSettingsSidebar className="h-svh" />
			<main className="container max-w-4xl py-20">{children}</main>
		</SidebarProvider>
	);
}

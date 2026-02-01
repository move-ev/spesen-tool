import { SidebarProvider } from "@zemio/ui/components/sidebar";
import { OrganizationSettingsSidebar } from "@/components/org-settings-sidebar";

export default async function ServerLayout({
	children,
}: LayoutProps<"/org/settings">) {
	return (
		<SidebarProvider>
			<OrganizationSettingsSidebar />
			<div className="flex-1 *:data-[slot='shell']:space-y-12">{children}</div>
		</SidebarProvider>
	);
}

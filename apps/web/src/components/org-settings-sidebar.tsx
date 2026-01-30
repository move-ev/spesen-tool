import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@zemio/ui/components/sidebar";
import { SettingsIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

const items = [
	{
		label: "Allgemein",
		href: "/org/settings",
		icon: SettingsIcon,
	},
	{
		label: "Mitglieder",
		href: "/org/settings/members",
		icon: UsersIcon,
	},
];

export function OrganizationSettingsSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{items.map((item) => (
							<SidebarMenuItem key={item.href}>
								<SidebarMenuButton
									render={
										<Link href={item.href}>
											<item.icon />
											{item.label}
										</Link>
									}
								/>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}

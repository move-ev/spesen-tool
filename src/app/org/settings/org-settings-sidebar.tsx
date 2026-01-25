import { SettingsIcon, UserCircle2Icon } from "lucide-react";
import Link from "next/link";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
	{
		href: "/org/settings",
		label: "Allgemeines",
		icon: SettingsIcon,
	},
	{
		href: "/org/settings/members",
		label: "Mitglieder",
		icon: UserCircle2Icon,
	},
];

export function OrganizationSettingsSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="none" {...props}>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Organisation</SidebarGroupLabel>
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

import { ArrowLeftIcon, SettingsIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ADMIN_SETTINGS_MENU, ROUTES } from "@/lib/consts";

const settingsMenu = [
	{
		label: "Allgemeines",
		href: ADMIN_SETTINGS_MENU.GENERAL,
		icon: SettingsIcon,
	},
	{
		label: "Benutzer",
		href: ADMIN_SETTINGS_MENU.USERS,
		icon: UsersIcon,
	},
];

export function AdminSettingsSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<Button
					className={"w-fit justify-start"}
					render={
						<Link href={ROUTES.ADMIN_DASHBOARD}>
							<ArrowLeftIcon /> Zurück
						</Link>
					}
					variant={"ghost"}
				/>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Einstellungen</SidebarGroupLabel>
					<SidebarMenu>
						{settingsMenu.map((item) => (
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

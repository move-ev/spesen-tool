"use client";

import { Settings2, ShieldUserIcon } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/consts";
import { api } from "@/trpc/react";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";

export function AppSidebarAdmin() {
	const [user] = api.user.getCurrent.useSuspenseQuery();

	if (!user || user.role !== "admin") return null;

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Admins</SidebarGroupLabel>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						render={
							<Link href={ROUTES.ADMIN_DASHBOARD}>
								<ShieldUserIcon />
								Admin Dashboard
							</Link>
						}
					/>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton>
						<Settings2 />
						App Einstellungen
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}

"use client";

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@zemio/ui/components/sidebar";
import { Settings2, ShieldUserIcon } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/consts";
import { authClient } from "@/server/better-auth/client";

export function AppSidebarAdmin() {
	const { isPending, data } = authClient.useSession();

	if (isPending || !data?.user) return null;

	if (data.user.role !== "admin") return null;

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
					<SidebarMenuButton
						render={
							<Link href={ROUTES.ADMIN_SETTINGS}>
								<Settings2 />
								App Einstellungen
							</Link>
						}
					/>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}

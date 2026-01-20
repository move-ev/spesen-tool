import { HomeIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ROUTES } from "@/lib/consts";
import { api, HydrateClient } from "@/trpc/server";
import { AppSidebarAdmin } from "./app-sidebar-admin";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";
import { UserMenu } from "./user-menu";

const sidebarItems = [
	{
		label: "Dashboard",
		href: ROUTES.USER_DASHBOARD,
		icon: HomeIcon,
	},
];

export function AppSidebar() {
	void api.user.getCurrent.prefetch();

	return (
		<HydrateClient>
			<Sidebar>
				<SidebarHeader></SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Navigation</SidebarGroupLabel>
						<SidebarMenu>
							{sidebarItems.map((item) => (
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
					<Suspense>
						<AppSidebarAdmin />
					</Suspense>
				</SidebarContent>
				<SidebarFooter>
					<UserMenu />
				</SidebarFooter>
			</Sidebar>
		</HydrateClient>
	);
}

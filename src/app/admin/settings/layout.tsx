import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@/components/ui/sidebar";
import { ADMIN_SETTINGS_MENU, ROUTES } from "@/lib/consts";

export default async function ServerLayout({
	children,
}: LayoutProps<"/admin/settings">) {
	return (
		<SidebarProvider>
			<Sidebar>
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
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									render={
										<Link href={ADMIN_SETTINGS_MENU.GENERAL}>
											<SettingsIcon />
											Allgemeines
										</Link>
									}
								/>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
			<div className="container max-w-3xl py-12">{children}</div>
		</SidebarProvider>
	);
}

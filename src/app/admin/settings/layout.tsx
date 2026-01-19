import { ArrowLeftIcon, MenuIcon, SettingsIcon } from "lucide-react";
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
	SidebarProvider,
	SidebarTrigger,
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
						<SidebarGroupLabel>Einstellungen</SidebarGroupLabel>
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
			<div className="container max-w-3xl py-8">
				<div className="mb-8 flex items-center justify-start gap-4">
					<SidebarTrigger>
						<MenuIcon />
					</SidebarTrigger>
					<Button
						className={"inline-flex md:hidden"}
						render={
							<Link href={ROUTES.ADMIN_DASHBOARD}>
								<ArrowLeftIcon /> Zurück
							</Link>
						}
						variant={"outline"}
					/>
				</div>
				{children}
			</div>
		</SidebarProvider>
	);
}

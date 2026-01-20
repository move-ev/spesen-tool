import { ArrowLeftIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { AdminSettingsSidebar } from "@/components/admin-settings-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ROUTES } from "@/lib/consts";

export default async function ServerLayout({
	children,
}: LayoutProps<"/admin/settings">) {
	return (
		<SidebarProvider>
			<AdminSettingsSidebar />
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

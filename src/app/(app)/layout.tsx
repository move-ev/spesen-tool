import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ROUTES } from "@/lib/consts";
import { auth } from "@/server/better-auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// When the user is not logged in, redirect to the login page
	if (!session) {
		redirect(ROUTES.AUTH);
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<div className="flex-1">
				<SiteHeader />
				{children}
			</div>
		</SidebarProvider>
	);
}

import { SidebarProvider } from "@zemio/ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/consts";
import { AppSidebar } from "@/modules/shared";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";

export default async function AppLayout({ children }: { children: ReactNode }) {
	const requestHeaders = await headers();
	const session = await auth.api.getSession({
		headers: requestHeaders,
	});

	// When the user is not logged in, redirect to the login page
	if (!session) {
		redirect(ROUTES.AUTH);
	}

	const memberCount = await db.member.count({
		where: {
			userId: session.user.id,
		},
	});

	if (memberCount === 0) {
		redirect(ROUTES.NO_ORG);
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<div className="min-w-0 flex-1">{children}</div>
		</SidebarProvider>
	);
}

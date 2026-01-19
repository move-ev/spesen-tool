import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/consts";
import { auth } from "@/server/better-auth";

export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// When the user is not logged in, redirect to the login page
	if (!session) {
		redirect(ROUTES.AUTH);
	}

	const { user } = session;

	// If user is not admin, redirect to dashboard
	if (user.role !== "admin") {
		redirect(ROUTES.USER_DASHBOARD);
	}

	return <>{children}</>;
}

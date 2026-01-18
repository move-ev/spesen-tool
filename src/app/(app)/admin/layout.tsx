import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/consts";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";

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

	// Check if user is admin
	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: { admin: true },
	});

	// If user is not admin, redirect to dashboard
	if (user?.admin !== true) {
		redirect(ROUTES.USER_DASHBOARD);
	}

	return <>{children}</>;
}

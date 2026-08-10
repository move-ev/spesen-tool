import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/consts";
import { SettingsLayout } from "@/modules/settings";
import { getCurrentSession } from "@/server/better-auth";

export default async function ServerLayout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await getCurrentSession();

	// When the user is not logged in, redirect to the login page
	if (!session) {
		redirect(ROUTES.AUTH);
	}

	return <SettingsLayout>{children}</SettingsLayout>;
}

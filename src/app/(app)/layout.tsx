import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "@/components/navigation/header";
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
		<>
			<Header />
			{children}
		</>
	);
}

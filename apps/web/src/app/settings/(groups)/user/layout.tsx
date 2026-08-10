import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/routes";
import { getCurrentSession } from "@/server/better-auth";

export default async function ServerLayout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await getCurrentSession();

	if (!session?.user) {
		redirect(ROUTES.AUTH());
	}

	return children;
}

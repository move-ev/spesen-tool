import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/consts";
import { auth } from "@/server/better-auth";

export default async function ServerLayout({ children }: LayoutProps<"/">) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// When the user is not logged in, redirect to the login page
	if (!session) {
		redirect(ROUTES.AUTH);
	}

	return <>{children}</>;
}

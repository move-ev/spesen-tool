import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ROUTES } from "@/lib/consts";
import { auth } from "@/server/better-auth";

/**
 * Routes starting with /org are only accessible, when an active organization is present.
 * When no active organization is present, the user will be redirected to the /org page.
 *
 * This route does not check for authentication, but only for the presence of an active
 * organization. When no active organization is present, the layout assumes that the user
 * is authenticated and will be redirected to the `/` route.
 */
export default async function ServerLayout({
	children,
	params,
}: LayoutProps<"/org/[slug]">) {
	const { slug } = await params;

	try {
		const organization = await auth.api.setActiveOrganization({
			headers: await headers(),
			body: {
				organizationSlug: slug,
			},
		});

		if (!organization) {
			redirect(ROUTES.USER_DASHBOARD);
		}

		console.log("organization", organization);

		await auth.api.setActiveOrganization({
			headers: await headers(),
			body: {
				organizationSlug: slug,
			},
		});
	} catch (error) {
		console.error(error);
		redirect(ROUTES.USER_DASHBOARD);
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="flex-1">{children}</main>
		</SidebarProvider>
	);
}

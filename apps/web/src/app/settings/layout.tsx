import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/consts";
import { SettingsLayout } from "@/modules/settings";
import { BillingBanner } from "@/modules/shared";
import { getCurrentSession } from "@/server/better-auth";
import { api, HydrateClient } from "@/trpc/server";

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

	// Settings is a sibling route group, so it inherits nothing from the
	// application layout — including the banner. Without this the explanation of
	// why an organization is read-only disappears at exactly the moment someone
	// follows the banner's own link to the billing page. Same query, so the two
	// layouts cannot disagree.
	void api.billing.status.prefetch();

	return (
		<SettingsLayout>
			<HydrateClient>
				<BillingBanner className="mx-6 mt-6" />
			</HydrateClient>
			{children}
		</SettingsLayout>
	);
}

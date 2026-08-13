import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OrgSettingsBilling } from "@/modules/settings/components";
import { auth } from "@/server/better-auth";
import { billingConfig } from "@/server/modules/billing/billing.config";
import { api, HydrateClient } from "@/trpc/server";

export default async function ServerPage(
	_props: PageProps<"/settings/org/billing">,
) {
	// A deployment that does not bill has no billing page. The navigation entry
	// is hidden too, but this is the control — hiding is only presentation
	// (ADR-0001).
	if (!billingConfig.enabled) {
		notFound();
	}

	// The group layout admits administrators, who may run the organization but
	// may not commit it to paying for Zemio. `organization: ["delete"]` is the
	// owner's alone.
	const isOwner = await auth.api.hasPermission({
		headers: await headers(),
		body: { permissions: { organization: ["delete"] } },
	});

	if (!isOwner.success) {
		notFound();
	}

	await Promise.all([
		api.billing.status.prefetch(),
		api.billing.tiers.prefetch(),
	]);

	return (
		<HydrateClient>
			<OrgSettingsBilling />
		</HydrateClient>
	);
}

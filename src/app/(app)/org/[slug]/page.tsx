"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/server/better-auth/client";

export default function Page() {
	const { data: activeOrganization, isPending: isActiveOrganizationPending } =
		authClient.useActiveOrganization();

	return (
		<div>
			<h1>
				{isActiveOrganizationPending ? (
					<Skeleton className="h-10 w-full" />
				) : (
					activeOrganization?.name
				)}
			</h1>
			<p>
				{isActiveOrganizationPending ? (
					<Skeleton className="h-10 w-full" />
				) : (
					activeOrganization?.slug
				)}
			</p>
		</div>
	);
}

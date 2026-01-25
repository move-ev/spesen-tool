import { headers } from "next/headers";
import type React from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getDomainFromEmail } from "@/lib/utils/organization";
import { auth } from "@/server/better-auth";
import { api } from "@/trpc/server";
import { JoinSuggestedOrganization } from "./join-suggested-organization";

export async function SuggestedOrganization({
	className,
	...props
}: React.ComponentProps<"div">) {
	const user = await auth.api.getSession({ headers: await headers() });

	if (!user) {
		return <SuggestedOrganizationNoneFound className={className} {...props} />;
	}

	const domain = getDomainFromEmail(user.user.email ?? "");

	if (!domain) {
		return <SuggestedOrganizationNoneFound className={className} />;
	}

	const organization = await api.organization.getForDomain({ domain });

	if (!organization) {
		return <SuggestedOrganizationNoneFound className={className} {...props} />;
	}

	void api.organization.listOwn.prefetch();

	return (
		<JoinSuggestedOrganization
			className={className}
			domain={domain}
			organization={organization}
			{...props}
		/>
	);
}

export function SuggestedOrganizationNoneFound({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-2 rounded-lg border p-6",
				className,
			)}
			{...props}
		>
			<span className="font-medium text-sm">
				Keine passende Organisation gefunden
			</span>
		</div>
	);
}

export function SuggestedOrganizationLoading({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-2 rounded-lg border p-6",
				className,
			)}
			{...props}
		>
			<Spinner />
			<span className="font-medium text-sm">
				Wir suchen nach einer passenden Organisation für dich...
			</span>
		</div>
	);
}

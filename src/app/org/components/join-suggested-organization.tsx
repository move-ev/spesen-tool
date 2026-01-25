"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Organization } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export function JoinSuggestedOrganization({
	className,
	organization,
	domain,
	...props
}: React.ComponentProps<"div"> & {
	organization: Organization;
	domain: string;
}) {
	const joinOrganization =
		api.organization.joinSuggestedOrganization.useMutation();
	const utils = api.useUtils();
	const { data, isLoading, isPending } = api.organization.listOwn.useQuery();

	const isMemberAlready = React.useMemo(() => {
		return data?.some((org) => org.id === organization.id);
	}, [data, organization.id]);

	const handleJoinOrganization = () => {
		toast.promise(joinOrganization.mutateAsync(), {
			loading: "Wir versuchen dich dieser Organisation hinzuzufügen",
			success: "Du wurdest erfolgreich dieser Organisation hinzugefügt",
			error: "Fehler beim Hinzufügen zur Organisation",
			finally: () => {
				utils.organization.listOwn.invalidate();
			},
		});
	};

	return (
		<div
			className={cn(
				"flex items-center justify-between gap-4 rounded-lg border p-4",
				className,
			)}
			{...props}
		>
			<div>
				<h2 className="font-medium">{organization.name}</h2>
				<p className="mt-1 text-muted-foreground text-xs">
					Aufgrund deiner <span className="font-medium">@{domain}</span> E-Mail
					Adresse bist du berechtigt, dieser Organisation beizutreten.
				</p>
			</div>
			<Button
				disabled={isMemberAlready || isPending || isLoading}
				onClick={handleJoinOrganization}
				variant={isMemberAlready ? "outline" : "default"}
			>
				{isPending || isLoading ? (
					<Spinner />
				) : isMemberAlready ? (
					"Bereits Mitglied"
				) : (
					"Beitreten"
				)}
			</Button>
		</div>
	);
}

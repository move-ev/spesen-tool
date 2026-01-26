"use client";

import { ArrowRightIcon, CircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
				<h2 className="flex items-center justify-start gap-3 font-medium">
					{organization.name}
					{isMemberAlready && (
						<Badge variant={"outline"}>
							<CircleIcon className="me-0.5 size-2! fill-primary text-primary" />
							Bereits Mitglied
						</Badge>
					)}
				</h2>
				<p className="mt-1 text-muted-foreground text-xs">
					Aufgrund deiner <span className="font-medium">@{domain}</span> E-Mail
					Adresse bist du berechtigt, dieser Organisation beizutreten.
				</p>
			</div>
			{(() => {
				if (isPending || isLoading) {
					return (
						<Button className={"w-32"} disabled variant={"outline"}>
							<Spinner />
						</Button>
					);
				}

				if (isMemberAlready) {
					return (
						<Button
							nativeButton={false}
							render={
								<Link href={`/org/${organization.slug}`}>
									Zum Dashboard <ArrowRightIcon className="size-4" />
								</Link>
							}
							variant={"outline"}
						/>
					);
				}

				return (
					<Button
						className={"w-24"}
						onClick={handleJoinOrganization}
						variant={"default"}
					>
						Beitreten
					</Button>
				);
			})()}
		</div>
	);
}

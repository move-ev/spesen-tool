"use client";

import { Button } from "@zemio/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@zemio/ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@zemio/ui/components/dropdown-menu";
import { Skeleton } from "@zemio/ui/components/skeleton";
import { GlobeIcon, PlusIcon } from "lucide-react";
import React, { useState } from "react";
import { useOrgSlug } from "@/hooks/use-org-slug";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/better-auth/client";
import { CreateOrganizationForm } from "./forms/org/create-org";

export function OrganizationSwitcher({
	className,
	...props
}: React.ComponentProps<typeof Button>) {
	const [createNewOpen, setCreateNewOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const { replace: replaceOrgSlug } = useOrgSlug();

	const handleCreateNew = () => {
		// Close dropdown first, then open dialog after a tick
		// This prevents focus management conflicts between the two components
		setDropdownOpen(false);
		setTimeout(() => setCreateNewOpen(true), 0);
	};

	const {
		data: organizations,
		isPending: isOrganizationsPending,
		refetch: refetchOrganizations,
	} = authClient.useListOrganizations();

	const {
		data: activeOrganization,
		isPending: isActiveOrganizationPending,
		refetch: refetchActiveOrganization,
	} = authClient.useActiveOrganization();

	// Only show skeleton on initial load, not on refetch
	// Refetching while dialog is open would unmount the dialog
	if (isOrganizationsPending || isActiveOrganizationPending) {
		return <Skeleton className="h-8 w-24" />;
	}

	return (
		<React.Fragment>
			<DropdownMenu onOpenChange={setDropdownOpen} open={dropdownOpen}>
				<DropdownMenuTrigger
					render={
						<Button className={cn("w-48", className)} variant={"outline"} {...props}>
							<GlobeIcon />
							<span className="w-full min-w-0 truncate text-left font-medium text-sm">
								{activeOrganization?.name ?? "Keine Organisation ausgewählt"}
							</span>
						</Button>
					}
				/>
				<DropdownMenuContent className={"min-w-56"} side="bottom">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Deine Organisationen</DropdownMenuLabel>
						{organizations?.length === 0 ? (
							<DropdownMenuItem disabled>
								Keine Organisationen gefunden
							</DropdownMenuItem>
						) : (
							organizations?.map((org) => (
								<DropdownMenuItem
									key={org.id}
									onClick={() => {
										replaceOrgSlug(org.slug);
										refetchActiveOrganization();
									}}
								>
									<span className="flex w-full min-w-0 flex-col items-start justify-center">
										<span className="block w-full min-w-0 truncate font-medium text-sm">
											{org.name}
										</span>
										<span className="w-full min-w-0 truncate text-muted-foreground text-xs">
											{org.slug}
										</span>
									</span>
								</DropdownMenuItem>
							))
						)}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={handleCreateNew}>
							<PlusIcon />
							Neue Organisation erstellen
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog onOpenChange={setCreateNewOpen} open={createNewOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Neue Organisation erstellen</DialogTitle>
						<DialogDescription>
							Erstelle eine neue Organisation um mehrere Nutzer zu verwalten.
						</DialogDescription>
					</DialogHeader>
					<div>
						<CreateOrganizationForm
							onSuccess={() => {
								setCreateNewOpen(false);
								refetchOrganizations();
								refetchActiveOrganization();
							}}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</React.Fragment>
	);
}

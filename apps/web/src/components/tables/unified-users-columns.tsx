"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@zemio/ui/components/avatar";
import { Badge } from "@zemio/ui/components/badge";
import { Button } from "@zemio/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@zemio/ui/components/dropdown-menu";
import { format } from "date-fns";
import { EllipsisIcon, UserCircleIcon } from "lucide-react";
import { toast } from "sonner";
import type { UnifiedUserRow } from "@/lib/types/organization";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";

/**
 * Actions menu for organization members.
 * Includes cache invalidation after successful removal.
 */
function MemberActions({ userId, email }: { userId: string; email: string }) {
	const utils = api.useUtils();

	const handleRemoveMember = async () => {
		try {
			await authClient.organization.removeMember({
				memberIdOrEmail: userId,
			});

			// Invalidate the unified users query to refetch data
			await utils.organization.listUsersUnified.invalidate();

			toast.success("Nutzer wurde erfolgreich entfernt");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Fehler beim Entfernen des Nutzers",
			);
			throw error;
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={`Aktionen für ${email}`}
				render={
					<Button size="icon-sm" variant="ghost">
						<EllipsisIcon className="size-4" />
						<span className="sr-only">Aktionen öffnen</span>
					</Button>
				}
			/>
			<DropdownMenuContent>
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={() => {
							void toast.promise(handleRemoveMember(), {
								loading: "Nutzer wird entfernt...",
							});
						}}
						variant="destructive"
					>
						Entfernen
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * Actions menu for invitations.
 * Currently disabled - placeholder for future functionality.
 */
function InvitationActions({
	invitationId: _invitationId,
}: {
	invitationId: string;
}) {
	return (
		<Button
			aria-label="Einladung bearbeiten (noch nicht verfügbar)"
			disabled
			size="icon-sm"
			title="Einladung bearbeiten (Feature noch nicht implementiert)"
			variant="outline"
		>
			<EllipsisIcon className="size-4" />
			<span className="sr-only">Aktionen (deaktiviert)</span>
		</Button>
	);
}

/**
 * Column definitions for the unified users table.
 *
 * Includes columns for avatar, name/email, role, status, join date, and actions.
 * Uses discriminated union types for type-safe rendering of members vs invitations.
 */
export const unifiedUsersColumns: ColumnDef<UnifiedUserRow>[] = [
	{
		id: "avatar",
		header: "",
		cell: ({ row }) => {
			const user = row.original;

			if (user.type === "member") {
				return (
					<Avatar aria-hidden="true" className="size-6">
						<AvatarImage alt="" src={user.image ?? undefined} />
						<AvatarFallback>
							{user.name?.charAt(0).toLocaleUpperCase() ?? "?"}
						</AvatarFallback>
					</Avatar>
				);
			}

			return (
				<UserCircleIcon
					aria-hidden="true"
					className="size-5 text-muted-foreground"
				/>
			);
		},
	},
	{
		id: "name",
		accessorKey: "email",
		header: "Name / E-Mail",
		meta: { filterType: "text" },
		cell: ({ row }) => {
			const user = row.original;

			if (user.type === "member" && user.name) {
				return (
					<div className="space-y-0.5">
						<span className="block font-medium text-foreground text-xs">
							{user.name}
						</span>
						<span className="block text-muted-foreground text-xs">{user.email}</span>
					</div>
				);
			}

			return (
				<span className="block font-medium text-foreground text-xs">
					{user.email}
				</span>
			);
		},
	},
	{
		id: "role",
		accessorKey: "role",
		header: "Rolle",
		cell: ({ row }) => {
			return (
				<Badge className="rounded-md bg-muted" variant="outline">
					<span className="font-mono">{row.original.role}</span>
				</Badge>
			);
		},
	},
	{
		id: "status",
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const { status } = row.original;

			const statusConfig = {
				active: {
					label: "Aktiv",
					variant: "default" as const,
					ariaLabel: "Status: Aktives Mitglied",
				},
				pending: {
					label: "Ausstehend",
					variant: "secondary" as const,
					ariaLabel: "Status: Einladung ausstehend",
				},
				expired: {
					label: "Abgelaufen",
					variant: "destructive" as const,
					ariaLabel: "Status: Einladung abgelaufen",
				},
			};

			const config = statusConfig[status];

			return (
				<Badge
					aria-label={config.ariaLabel}
					className="rounded-md"
					variant={config.variant}
				>
					{config.label}
				</Badge>
			);
		},
	},
	{
		id: "joinedAt",
		accessorKey: "joinedAt",
		header: "Beigetreten / Erstellt",
		cell: ({ row }) => {
			const { joinedAt } = row.original;
			const formattedDate = format(joinedAt, "dd.MM.yyyy");
			const formattedTime = format(joinedAt, "HH:mm");

			return (
				<time
					className="text-sm"
					dateTime={joinedAt.toISOString()}
					title={joinedAt.toLocaleString("de-DE")}
				>
					{formattedDate} um {formattedTime} Uhr
				</time>
			);
		},
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => {
			const user = row.original;

			if (user.type === "member") {
				return <MemberActions email={user.email} userId={user.userId} />;
			}

			return <InvitationActions invitationId={user.id} />;
		},
	},
	{
		id: "type",
		accessorKey: "type",
		enableGrouping: true,
		getGroupingValue: (row) =>
			row.type === "member" ? "Aktive Mitglieder" : "Einladungen",
		// Hidden column used for grouping only
		header: () => null,
		cell: () => null,
	},
];

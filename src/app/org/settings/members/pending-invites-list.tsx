"use client";

import { MailIcon } from "lucide-react";
import { List, ListItem } from "@/components/list";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { translateOrganizationRole } from "@/lib/utils/organization";
import { api } from "@/trpc/react";

export function PendingInvitesList() {
	const [invitations] = api.invitation.listPending.useSuspenseQuery();

	return (
		<List className="divide-y overflow-hidden rounded-lg">
			{invitations.length === 0 && (
				<Empty className="min-h-48">
					<EmptyHeader>
						<EmptyMedia>
							<MailIcon />
						</EmptyMedia>
						<EmptyTitle>Keine ausstehenden Einladungen</EmptyTitle>
						<EmptyDescription>
							Derzeit gibt es keine ausstehenden Einladungen.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}

			{invitations.map((invitation) => (
				<ListItem className="gap-4 pl-4!" key={invitation.id}>
					<span className="font-medium text-foreground">{invitation.email}</span>
					<Badge variant="outline">
						{translateOrganizationRole(invitation.role ?? "member")}
					</Badge>
					{invitation.expiresAt < new Date() && (
						<Badge variant="destructive">Abgelaufen</Badge>
					)}
				</ListItem>
			))}
		</List>
	);
}

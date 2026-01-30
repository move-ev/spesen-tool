"use client";

import { Button } from "@zemio/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@zemio/ui/components/dropdown-menu";
import { toast } from "sonner";
import type { User } from "@/generated/prisma/client";
import { authClient } from "@/server/better-auth/client";

export function MemberActionsMenu({
	member,
	...props
}: React.ComponentProps<typeof Button> & { member: User }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button {...props} />} />
			<DropdownMenuContent>
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={() => {
							toast.promise(
								authClient.organization.removeMember({ memberIdOrEmail: member.id }),
								{
									loading: "Nutzer wird entfernt",
									success: "Nutzer wurde erfolgreich entfernt",
									error: "Fehler beim Entfernen des Nutzers",
								},
							);
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

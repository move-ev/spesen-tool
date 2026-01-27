"use client";

import { EllipsisIcon, ShieldUserIcon, ShieldXIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import type { User } from "@/generated/prisma/client";
import { api } from "@/trpc/react";

export function UserList() {
	const [users] = api.settings.listUsers.useSuspenseQuery();

	return (
		<div className="overflow-x-auto rounded-lg border shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell className="flex gap-2 font-medium">
								<Avatar className={"size-5"}>
									<AvatarImage src={user.image ?? undefined} />
									<AvatarFallback>
										{user.name
											?.split(" ")
											.map((name) => name.charAt(0))
											.join("")}
									</AvatarFallback>
								</Avatar>
								{user.name}
							</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell>{user.role}</TableCell>
							<TableCell className="flex justify-end">
								<UserActions size={"icon"} user={user} variant={"ghost"}>
									<EllipsisIcon />
								</UserActions>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function UserActions({
	user,
	...props
}: React.ComponentProps<typeof Button> & { user: User }) {
	const utils = api.useUtils();
	const { mutate: promoteToAdmin } = api.user.promoteToAdmin.useMutation({
		onSuccess: () => {
			toast.success("User promoted to admin");
			utils.settings.listUsers.invalidate();
		},
		onError: ({ message }) => {
			toast.error("Failed to promote user to admin", {
				description: message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});
	const { mutate: demoteFromAdmin } = api.user.demoteFromAdmin.useMutation({
		onSuccess: () => {
			toast.success("User demoted from admin");
			utils.settings.listUsers.invalidate();
		},
		onError: ({ message }) => {
			toast.error("Failed to demote user from admin", {
				description: message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button {...props} />} />
			<DropdownMenuContent align="end" className="w-full min-w-48 max-w-72">
				<DropdownMenuItem onClick={() => promoteToAdmin({ targetUserId: user.id })}>
					<ShieldUserIcon /> Zu admin machen
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => demoteFromAdmin({ targetUserId: user.id })}
					variant="destructive"
				>
					<ShieldXIcon /> Von admin entfernen
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

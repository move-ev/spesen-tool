"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@zemio/ui/components/avatar";
import { Badge } from "@zemio/ui/components/badge";
import { format } from "date-fns";
import { EllipsisIcon } from "lucide-react";
import type { Member, User } from "@/generated/prisma/client";
import { MemberActionsMenu } from "../member-actions-menu";

export const organizationMembersColumns: ColumnDef<
	Omit<Member, "user"> & { user: User }
>[] = [
	{
		id: "avatar",
		accessorKey: "user.image",
		header: "",
		cell: ({ row }) => {
			return (
				<Avatar className="size-6">
					<AvatarImage src={row.original.user.image ?? undefined} />
					<AvatarFallback>
						{row.original.user.name?.charAt(0).toLocaleUpperCase() ?? "?"}
					</AvatarFallback>
				</Avatar>
			);
		},
	},
	{
		id: "name",
		accessorKey: "user.name",
		header: "Name",
		cell: ({ row }) => {
			return (
				<div className="space-y-0.5">
					<span className="block font-medium text-foreground text-xs">
						{row.original.user.name}
					</span>
					<span className="block text-muted-foreground text-xs">
						{row.original.user.email}
					</span>
				</div>
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
		id: "joinedAt",
		accessorKey: "role",
		header: "Beigetreten",
		cell: ({ row }) => {
			return (
				<div>
					{format(row.original.createdAt, "dd.MM.yyyy")} um{" "}
					{format(row.original.createdAt, "HH:mm")} Uhr
				</div>
			);
		},
	},
	{
		id: "actions",

		cell: ({ row }) => {
			return (
				<div>
					<MemberActionsMenu
						member={row.original.user}
						size={"icon-sm"}
						variant={"ghost"}
					>
						<EllipsisIcon />
					</MemberActionsMenu>
				</div>
			);
		},
	},
];

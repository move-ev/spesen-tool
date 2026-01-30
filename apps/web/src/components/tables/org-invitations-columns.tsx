"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@zemio/ui/components/badge";
import { Button } from "@zemio/ui/components/button";
import { format } from "date-fns";
import { PencilIcon, UserCircleIcon } from "lucide-react";
import type { Invitation } from "@/generated/prisma/client";

export const organizationInvitationsColumns: ColumnDef<Invitation>[] = [
	{
		id: "avatar",
		header: "",
		cell: () => {
			return <UserCircleIcon className="size-5 text-muted-foreground" />;
		},
	},
	{
		id: "email",
		accessorKey: "email",
		header: "E-Mail",
		cell: ({ row }) => {
			return (
				<span className="block font-medium text-foreground text-xs">
					{row.original.email}
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
		id: "created",
		accessorKey: "createdAt",
		header: "Erstellt am",
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
		id: "status",
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			return (
				<div>
					<span className="font-mono">{row.original.status}</span>
				</div>
			);
		},
	},
	{
		id: "actions",

		cell: () => {
			return (
				<div>
					<Button variant="outline">
						<PencilIcon className="size-4" />
					</Button>
				</div>
			);
		},
	},
];

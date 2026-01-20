"use client";

import { format } from "date-fns";
import { EllipsisIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { BusinessUnit } from "@/generated/prisma/client";
import { api } from "@/trpc/react";

export function BusinessUnitsTable() {
	const [businessUnits] = api.businessUnit.listAll.useSuspenseQuery();

	return (
		<div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Erstellt am</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{businessUnits.map((businessUnit) => (
						<TableRow key={businessUnit.id}>
							<TableCell>{businessUnit.name}</TableCell>
							<TableCell>
								{format(businessUnit.createdAt, "dd.MM.yyyy HH:mm")}
							</TableCell>
							<TableCell className="flex justify-end">
								<BusinessUnitActions
									businessUnit={businessUnit}
									size={"icon"}
									variant={"ghost"}
								/>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function BusinessUnitActions({
	businessUnit,
	...props
}: React.ComponentProps<typeof Button> & {
	businessUnit: BusinessUnit;
}) {
	const utils = api.useUtils();

	const deleteBusinessUnit = api.businessUnit.delete.useMutation({
		onSuccess: () => {
			toast.success("Geschäftseinheit erfolgreich gelöscht");
			utils.businessUnit.listAll.invalidate();
		},
		onError: (error) => {
			toast.error("Fehler beim Löschen der Geschäftseinheit", {
				description: error.message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button size={"icon"} variant={"ghost"} {...props}>
						<EllipsisIcon />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-full min-w-48 max-w-72">
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={() => deleteBusinessUnit.mutate({ id: businessUnit.id })}
						variant="destructive"
					>
						<TrashIcon />
						Löschen
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

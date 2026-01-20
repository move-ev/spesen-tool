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
import type { AccountingUnit } from "@/generated/prisma/client";
import { api } from "@/trpc/react";

export function AccountingUnitsTable() {
	const [accountingUnits] = api.accountingUnit.listAll.useSuspenseQuery();

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
					{accountingUnits.map((accountingUnit) => (
						<TableRow key={accountingUnit.id}>
							<TableCell>{accountingUnit.name}</TableCell>
							<TableCell>
								{format(accountingUnit.createdAt, "dd.MM.yyyy HH:mm")}
							</TableCell>
							<TableCell className="flex justify-end">
								<AccountingUnitActions
									accountingUnit={accountingUnit}
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

function AccountingUnitActions({
	accountingUnit,
	...props
}: React.ComponentProps<typeof Button> & {
	accountingUnit: AccountingUnit;
}) {
	const utils = api.useUtils();

	const deleteAccountingUnit = api.accountingUnit.delete.useMutation({
		onSuccess: () => {
			toast.success("Buchungskreis erfolgreich gelöscht");
			utils.accountingUnit.listAll.invalidate();
		},
		onError: (error) => {
			toast.error("Fehler beim Löschen des Buchungskreises", {
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
						onClick={() => deleteAccountingUnit.mutate({ id: accountingUnit.id })}
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

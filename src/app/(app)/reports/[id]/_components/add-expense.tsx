"use client";

import { CarIcon, PlusIcon, ReceiptIcon, UtensilsIcon } from "lucide-react";
import React from "react";
import { CreateReceiptExpenseForm } from "@/components/forms/expense/receipt";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

export function AddExpense({
	reportId,
	...props
}: React.ComponentProps<typeof Button> & { reportId: string }) {
	const [receiptOpen, setReceiptOpen] = React.useState(false);

	return (
		<React.Fragment>
			<DropdownMenu>
				<DropdownMenuTrigger render={<Button {...props} />} />
				<DropdownMenuContent className={"w-full max-w-72"}>
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={() => setReceiptOpen(true)}>
							<ReceiptIcon />
							Beleg
						</DropdownMenuItem>
						<DropdownMenuItem>
							<CarIcon />
							Reisepauschale
						</DropdownMenuItem>
						<DropdownMenuItem>
							<UtensilsIcon />
							Verpflegungspauschale
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<Sheet onOpenChange={setReceiptOpen} open={receiptOpen}>
				<SheetContent className={"w-full! md:max-w-2xl!"}>
					<SheetHeader>
						<SheetTitle>Ausgabe hinzufügen</SheetTitle>
						<SheetDescription>
							Füge eine neue Ausgabe zu deinem Report hinzu
						</SheetDescription>
					</SheetHeader>
					<div className="p-4">
						<CreateReceiptExpenseForm reportId={reportId} />
					</div>
				</SheetContent>
			</Sheet>
		</React.Fragment>
	);
}

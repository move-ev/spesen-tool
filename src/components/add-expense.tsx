"use client";

import { CarIcon, ReceiptIcon, UtensilsIcon } from "lucide-react";
import React from "react";
import { ExpenseIcon } from "./expense-icon";
import { CreateTravelExpenseForm } from "./forms/create-travel-expense-form";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function AddExpense({
	reportId,
	...props
}: React.ComponentProps<typeof Button> & { reportId: string }) {
	const [travelOpen, setTravelOpen] = React.useState(false);

	return (
		<React.Fragment>
			<DropdownMenu>
				<DropdownMenuTrigger render={<Button {...props} />} />
				<DropdownMenuContent align="end" className={"w-full max-w-72"}>
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<ExpenseIcon type="RECEIPT" />
							Belege
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTravelOpen(true)}>
							<ExpenseIcon type="TRAVEL" />
							Reisepauschale
						</DropdownMenuItem>
						<DropdownMenuItem>
							<ExpenseIcon type="FOOD" />
							Verpflegungspauschale
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog onOpenChange={setTravelOpen} open={travelOpen}>
				<DialogContent className="lg:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Reisepauschale hinzufügen</DialogTitle>
						<DialogDescription>
							Füge eine Reisepauschale zu deinem Report hinzu.
						</DialogDescription>
					</DialogHeader>
					<div>
						<CreateTravelExpenseForm
							onSuccess={() => setTravelOpen(false)}
							reportId={reportId}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</React.Fragment>
	);
}

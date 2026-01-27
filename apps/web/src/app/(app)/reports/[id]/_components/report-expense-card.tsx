"use client";

import type { JsonValue } from "@prisma/client/runtime/client";
import { Button } from "@zemio/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@zemio/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@zemio/ui/components/dropdown-menu";
import {
	CarIcon,
	EllipsisVerticalIcon,
	InfoIcon,
	ReceiptIcon,
	UtensilsIcon,
} from "lucide-react";
import React from "react";
import { ExpenseDetails } from "@/app/(app)/admin/_components/expense-details";
import { ReportCardField } from "@/components/report-card";
import type { Attachment, ExpenseType } from "@/generated/prisma/client";
import type { ClientExpense } from "@/lib/types";
import { translateExpenseType } from "@/lib/utils";
import {
	foodExpenseMetaSchema,
	travelExpenseMetaSchema,
} from "@/lib/validators";

export function ReportExpenseCard({
	className,
	expense,
	...props
}: React.ComponentProps<typeof Card> & {
	expense: ClientExpense & { attachments: Partial<Attachment>[] };
}) {
	const [detailsOpen, setDetailsOpen] = React.useState(false);

	return (
		<React.Fragment>
			<Card className={className} data-slot="report-expense-card" {...props}>
				<CardHeader>
					<CardTitle className="flex items-center justify-start gap-2 [&_svg]:size-4 [&_svg]:text-muted-foreground">
						{expense.type === "RECEIPT" ? (
							<ReceiptIcon />
						) : expense.type === "TRAVEL" ? (
							<CarIcon />
						) : (
							<UtensilsIcon />
						)}
						{translateExpenseType(expense.type)}
					</CardTitle>
					<CardDescription>
						{expense.type === "RECEIPT"
							? `${expense.attachments.length} Beleg(e)`
							: metaToDescription({ type: expense.type, meta: expense.meta })}
					</CardDescription>
					<CardAction>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										aria-label="Open expense actions"
										size={"icon"}
										variant={"ghost"}
									>
										<EllipsisVerticalIcon />
									</Button>
								}
							/>
							<DropdownMenuContent>
								<DropdownMenuGroup>
									<DropdownMenuItem onClick={() => setDetailsOpen(true)}>
										<InfoIcon /> Details
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</CardAction>
				</CardHeader>
				<CardContent className="space-y-2 border-t pt-4">
					<ReportCardField label="Betrag" value={`${expense.amount.toFixed(2)} €`} />
					<ReportCardField
						label="Datum"
						value={expense.startDate.toLocaleDateString()}
					/>
				</CardContent>
			</Card>
			<ExpenseDetails
				expense={expense}
				onOpenChange={setDetailsOpen}
				open={detailsOpen}
			/>
		</React.Fragment>
	);
}

/**
 * Builds a human-readable description from expense metadata.
 */
const metaToDescription = ({
	type,
	meta,
}: {
	type: ExpenseType;
	meta: JsonValue;
}): string | null => {
	let desc: string = "Ungültige Ausgabe";

	if (type === "TRAVEL") {
		const result = travelExpenseMetaSchema.safeParse(meta);

		if (!result.success) {
			return null;
		}

		desc = `${result.data.from} -> ${result.data.to}`;
	}

	if (type === "FOOD") {
		const result = foodExpenseMetaSchema.safeParse(meta);

		if (!result.success) {
			return null;
		}

		desc = `${result.data.days} Tage`;
	}

	return desc;
};

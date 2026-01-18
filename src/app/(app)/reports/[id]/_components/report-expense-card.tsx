"use client";

import type { JsonValue } from "@prisma/client/runtime/client";
import { CarIcon, ReceiptIcon, UtensilsIcon } from "lucide-react";
import type React from "react";
import { ReportCardField } from "@/components/report-card";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type {
	Attachment,
	Expense,
	ExpenseType,
} from "@/generated/prisma/client";
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
	expense: Expense & { attachments: Partial<Attachment>[] };
}) {
	return (
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
			</CardHeader>
			<CardContent className="space-y-2 border-t pt-4">
				<ReportCardField label="Betrag" value={`${expense.amount.toFixed(2)} €`} />
				<ReportCardField
					label="Datum"
					value={expense.startDate.toLocaleDateString()}
				/>
			</CardContent>
		</Card>
	);
}

const metaToDescription = ({
	type,
	meta,
}: {
	type: ExpenseType;
	meta: JsonValue;
}) => {
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

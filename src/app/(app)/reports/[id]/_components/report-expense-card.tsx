"use client";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Expense } from "@/generated/prisma/client";
import { translateExpenseType } from "@/lib/utils";

export function ReportExpenseCard({
	className,
	expense,
	...props
}: React.ComponentProps<typeof Card> & { expense: Expense }) {
	return (
		<Card className={className} data-slot="report-expense-card" {...props}>
			<CardHeader>
				<CardTitle>{translateExpenseType(expense.type)}</CardTitle>
				<CardDescription>
					{expense.description && expense.description.length > 0
						? expense.description
						: "Keine Beschreibung"}
				</CardDescription>
			</CardHeader>
		</Card>
	);
}

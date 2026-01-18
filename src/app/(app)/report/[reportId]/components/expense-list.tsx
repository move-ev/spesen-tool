"use client";

import { ExpenseIcon } from "@/components/expense-icon";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export function ExpenseList({
	className,
	reportId,
	...props
}: React.ComponentProps<"ul"> & { reportId: string }) {
	const [expenses] = api.expense.list.useSuspenseQuery({ reportId });

	return (
		<ul className={cn("gri grid grid-cols-4 gap-8", className)} {...props}>
			{expenses.map((expense) => (
				<Card key={expense.id}>
					<CardHeader>
						<CardTitle className="flex items-center justify-start gap-2">
							<ExpenseIcon type={expense.type} />
							{expense.description}
						</CardTitle>
						<CardDescription>{Number(expense.amount).toFixed(2)} €</CardDescription>
					</CardHeader>
				</Card>
			))}
		</ul>
	);
}

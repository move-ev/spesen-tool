import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateExpenseForm } from "@/components/forms/create-expense-form";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default async function NewExpensePage({
	params,
}: PageProps<"/reports/[id]/expenses/new">) {
	const { id } = await params;

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<Link href={`/reports/${id}`}>
				<Button className="mb-6" variant="ghost">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Zurück zum Report
				</Button>
			</Link>

			<Card>
				<CardHeader>
					<CardTitle>Neue Ausgabe</CardTitle>
					<CardDescription>Füge eine neue Ausgabe hinzu.</CardDescription>
				</CardHeader>
				<CardContent>
					<CreateExpenseForm reportId={id} />
				</CardContent>
			</Card>
		</div>
	);
}

import { CreateExpenseForm } from "@/components/forms/create-expense-form";

type NewExpensePageProps = {
	params: {
		id: string;
	};
};

export default function NewExpensePage({ params }: NewExpensePageProps) {
	return <CreateExpenseForm reportId={params.id} />;
}

import type { ReportStatus } from "@zemio/db";
import { isEditable } from "@/server/modules/report/report.state";
import { definePolicy } from "@/server/shared/authz/policy";

export type ExpensePolicyContext = {
	userId: string;
	isOrgAdmin: boolean;
};

export type ExpenseSubject = {
	report: {
		ownerId: string;
		status: ReportStatus;
	};
};

export type ExpenseAction = "read" | "update" | "delete" | "addAttachment";

export const expensePolicy = definePolicy<
	ExpenseAction,
	ExpensePolicyContext,
	ExpenseSubject
>(
	{
		read: (ctx, { report }) => ctx.isOrgAdmin || report.ownerId === ctx.userId,
		update: (ctx, { report }) =>
			report.ownerId === ctx.userId && isEditable(report.status),
		delete: (ctx, { report }) =>
			report.ownerId === ctx.userId && isEditable(report.status),
		addAttachment: (ctx, { report }) =>
			report.ownerId === ctx.userId && isEditable(report.status),
	},
	"You don't have access to this expense.",
);

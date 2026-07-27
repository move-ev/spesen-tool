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

export type ExpenseAction =
	| "read"
	| "create"
	| "update"
	| "delete"
	| "addAttachment";

/**
 * Every write to an expense carries the same condition: you own the report and
 * it is still in an editable state. Named once so the four write actions are
 * visibly the same rule rather than four copies that could drift apart.
 */
const canModify = (
	ctx: ExpensePolicyContext,
	{ report }: ExpenseSubject,
): boolean => report.ownerId === ctx.userId && isEditable(report.status);

export const expensePolicy = definePolicy<
	ExpenseAction,
	ExpensePolicyContext,
	ExpenseSubject
>(
	{
		read: (ctx, { report }) => ctx.isOrgAdmin || report.ownerId === ctx.userId,
		create: canModify,
		update: canModify,
		delete: canModify,
		addAttachment: canModify,
	},
	"You can only change expenses on your own draft or needs-revision reports.",
);

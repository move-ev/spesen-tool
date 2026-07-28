import { definePolicy } from "@/server/shared/authz/policy";

/**
 * Banking details are user-owned and never org-scoped, so the decision needs
 * only the caller's identity — there is no admin override. An organization
 * admin reviewing a report sees the immutable snapshot taken at submission,
 * not the owner's live record.
 */
export type BankingPolicyContext = {
	userId: string;
};

export type BankingSubject = {
	userId: string;
};

export type BankingAction = "read" | "update" | "delete";

const isOwner = (ctx: BankingPolicyContext, subject: BankingSubject): boolean =>
	subject.userId === ctx.userId;

export const bankingPolicy = definePolicy<
	BankingAction,
	BankingPolicyContext,
	BankingSubject
>(
	{
		read: isOwner,
		update: isOwner,
		delete: isOwner,
	},
	"You don't have access to these banking details",
);

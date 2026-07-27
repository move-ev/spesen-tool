import type { ReportStatus } from "@zemio/db";
import { definePolicy } from "@/server/shared/authz/policy";
import { isEditable } from "./report.state";

/**
 * The request-scoped facts an authorization decision is derived from. Resolved
 * once from the tRPC context — no second Better-Auth round trip per check.
 */
export type ReportPolicyContext = {
	userId: string;
	isOrgAdmin: boolean;
};

/** The minimal projection of a report needed to make an authorization decision. */
export type ReportSubject = {
	ownerId: string;
	status: ReportStatus;
};

export type ReportAction =
	| "read"
	| "update"
	| "submit"
	| "delete"
	| "transition"
	| "review";

export const reportPolicy = definePolicy<
	ReportAction,
	ReportPolicyContext,
	ReportSubject
>(
	{
		read: (ctx, report) => ctx.isOrgAdmin || report.ownerId === ctx.userId,
		update: (ctx, report) =>
			report.ownerId === ctx.userId && isEditable(report.status),
		submit: (ctx, report) =>
			report.ownerId === ctx.userId && isEditable(report.status),
		delete: (ctx, report) =>
			report.ownerId === ctx.userId && isEditable(report.status),
		transition: (ctx) => ctx.isOrgAdmin,
		review: (ctx) => ctx.isOrgAdmin,
	},
	"You don't have access to this report.",
);

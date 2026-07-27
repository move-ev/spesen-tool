import type { ReportStatus } from "@zemio/db";
import { isEditable } from "@/server/modules/report/report.state";
import { definePolicy } from "@/server/shared/authz/policy";

export type AttachmentPolicyContext = {
	userId: string;
	isOrgAdmin: boolean;
};

export type AttachmentSubject = {
	report: {
		ownerId: string;
		status: ReportStatus;
	};
};

export type AttachmentAction = "read" | "delete";

export const attachmentPolicy = definePolicy<
	AttachmentAction,
	AttachmentPolicyContext,
	AttachmentSubject
>(
	{
		read: (ctx, { report }) => ctx.isOrgAdmin || report.ownerId === ctx.userId,
		delete: (ctx, { report }) =>
			report.ownerId === ctx.userId && isEditable(report.status),
	},
	"You don't have access to this attachment.",
);

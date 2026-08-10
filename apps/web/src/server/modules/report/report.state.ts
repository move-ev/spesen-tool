import { TRPCError } from "@trpc/server";
import { ReportStatus } from "@zemio/db";
import { canAdminTransition } from "@/lib/report-transitions";

export function isEditable(status: ReportStatus): boolean {
	return status === ReportStatus.DRAFT || status === ReportStatus.NEEDS_REVISION;
}

/**
 * Statuses from which a report **owner** may submit for approval. The owner flow
 * is deliberately strict; broader status changes go through the admin transition.
 */
const SUBMITTABLE_STATUSES: readonly ReportStatus[] = [
	ReportStatus.DRAFT,
	ReportStatus.NEEDS_REVISION,
];

export function canSubmit(from: ReportStatus): boolean {
	return SUBMITTABLE_STATUSES.includes(from);
}

export function assertSubmittable(from: ReportStatus): void {
	if (!canSubmit(from)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Report is not available for submission.",
		});
	}
}

export function assertAdminTransition(
	from: ReportStatus,
	to: ReportStatus,
): void {
	if (!canAdminTransition(from, to)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Illegal status transition: ${from} -> ${to}`,
		});
	}
}

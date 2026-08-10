import type { ReportStatus } from "@zemio/db";

/**
 * Allowed **admin** status overrides. Broader than the owner submit flow: admins
 * may re-open finalized reports. `DRAFT` is never a transition target, and
 * `PAID` is terminal.
 *
 * See `docs/trpc-migration-report-slice.md` for why this diverges from the
 * doc's literal (terminal-state) table.
 *
 * The statuses are spelled out as literals rather than referenced through the
 * `ReportStatus` enum so review UI can import this without dragging the Prisma
 * runtime into the browser bundle — the same reason `COST_UNIT_STATUSES` in
 * `consts.ts` is written this way. `satisfies` still ties it to the schema at
 * compile time, so a new status is a type error until it is mapped.
 */
export const ADMIN_TRANSITIONS = {
	DRAFT: ["PENDING_APPROVAL"],
	PENDING_APPROVAL: ["ACCEPTED", "REJECTED", "NEEDS_REVISION", "PAID"],
	NEEDS_REVISION: ["PENDING_APPROVAL", "ACCEPTED", "REJECTED"],
	ACCEPTED: ["PENDING_APPROVAL", "NEEDS_REVISION", "REJECTED", "PAID"],
	REJECTED: ["PENDING_APPROVAL", "NEEDS_REVISION", "ACCEPTED"],
	PAID: [],
} as const satisfies Record<ReportStatus, readonly ReportStatus[]>;

/**
 * Whether an admin may move a report from `from` to `to`. The server enforces
 * this too (`assertAdminTransition`); the client uses it to avoid offering
 * actions that would only come back as a BAD_REQUEST.
 */
export function canAdminTransition(
	from: ReportStatus,
	to: ReportStatus,
): boolean {
	return (ADMIN_TRANSITIONS[from] as readonly ReportStatus[]).includes(to);
}

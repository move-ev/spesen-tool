import { ReportStatus } from "@zemio/db";
import { describe, expect, it } from "vitest";
import { canAdminTransition } from "./report-transitions";

const ALL_STATUSES = Object.values(ReportStatus);

function allowedFrom(from: ReportStatus): ReportStatus[] {
	return ALL_STATUSES.filter((to) => canAdminTransition(from, to));
}

describe("canAdminTransition", () => {
	it.each([
		[ReportStatus.DRAFT, [ReportStatus.PENDING_APPROVAL]],
		[
			ReportStatus.PENDING_APPROVAL,
			[
				ReportStatus.ACCEPTED,
				ReportStatus.REJECTED,
				ReportStatus.NEEDS_REVISION,
				ReportStatus.PAID,
			],
		],
		[
			ReportStatus.NEEDS_REVISION,
			[
				ReportStatus.PENDING_APPROVAL,
				ReportStatus.ACCEPTED,
				ReportStatus.REJECTED,
			],
		],
		[
			ReportStatus.ACCEPTED,
			[
				ReportStatus.PENDING_APPROVAL,
				ReportStatus.NEEDS_REVISION,
				ReportStatus.REJECTED,
				ReportStatus.PAID,
			],
		],
		[
			ReportStatus.REJECTED,
			[
				ReportStatus.PENDING_APPROVAL,
				ReportStatus.NEEDS_REVISION,
				ReportStatus.ACCEPTED,
			],
		],
		[ReportStatus.PAID, []],
	] as const)("allows %s to move only to %j", (from, expected) => {
		expect(allowedFrom(from).sort()).toEqual([...expected].sort());
	});

	it("never allows any status to transition back to DRAFT", () => {
		for (const from of ALL_STATUSES) {
			expect(canAdminTransition(from, ReportStatus.DRAFT)).toBe(false);
		}
	});
});

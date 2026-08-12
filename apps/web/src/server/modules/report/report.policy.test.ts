import { ReportStatus } from "@zemio/db";
import { describe, expect, it } from "vitest";
import { reportPolicy } from "./report.policy";

const owner = { userId: "owner_1", isOrgAdmin: false };
const otherMember = { userId: "member_2", isOrgAdmin: false };
const admin = { userId: "admin_1", isOrgAdmin: true };

const draftReport = { ownerId: "owner_1", status: ReportStatus.DRAFT };
const pendingReport = {
	ownerId: "owner_1",
	status: ReportStatus.PENDING_APPROVAL,
};

describe("reportPolicy.read", () => {
	it("allows the owner and any org admin, denies other members", () => {
		expect(reportPolicy.can("read", owner, draftReport)).toBe(true);
		expect(reportPolicy.can("read", admin, draftReport)).toBe(true);
		expect(reportPolicy.can("read", otherMember, draftReport)).toBe(false);
	});
});

describe("reportPolicy.update / submit / delete", () => {
	it.each([
		"update",
		"submit",
		"delete",
	] as const)("%s: allows the owner only while the report is editable", (action) => {
		expect(reportPolicy.can(action, owner, draftReport)).toBe(true);
		expect(reportPolicy.can(action, owner, pendingReport)).toBe(false);
	});

	it.each([
		"update",
		"submit",
		"delete",
	] as const)("%s: denies non-owners even when the report is editable", (action) => {
		expect(reportPolicy.can(action, otherMember, draftReport)).toBe(false);
		expect(reportPolicy.can(action, admin, draftReport)).toBe(false);
	});
});

describe("reportPolicy.transition", () => {
	it("is admin-only, regardless of ownership or status", () => {
		expect(reportPolicy.can("transition", admin, pendingReport)).toBe(true);
		expect(reportPolicy.can("transition", owner, pendingReport)).toBe(false);
	});
});

describe("reportPolicy.comment", () => {
	it("allows the owner and any org admin, denies other members", () => {
		expect(reportPolicy.can("comment", owner, pendingReport)).toBe(true);
		expect(reportPolicy.can("comment", admin, pendingReport)).toBe(true);
		expect(reportPolicy.can("comment", otherMember, pendingReport)).toBe(false);
	});
});

import { ReportStatus } from "@zemio/db";
import { describe, expect, it } from "vitest";
import { expensePolicy } from "./expense.policy";

const owner = { userId: "owner_1", isOrgAdmin: false };
const otherMember = { userId: "member_2", isOrgAdmin: false };
const admin = { userId: "admin_1", isOrgAdmin: true };

const editableExpense = {
	report: { ownerId: "owner_1", status: ReportStatus.NEEDS_REVISION },
};
const lockedExpense = {
	report: { ownerId: "owner_1", status: ReportStatus.ACCEPTED },
};

describe("expensePolicy.read", () => {
	it("allows the report owner and any org admin, denies other members", () => {
		expect(expensePolicy.can("read", owner, editableExpense)).toBe(true);
		expect(expensePolicy.can("read", admin, editableExpense)).toBe(true);
		expect(expensePolicy.can("read", otherMember, editableExpense)).toBe(false);
	});
});

describe("expensePolicy write actions (create/update/delete/addAttachment)", () => {
	it.each([
		"create",
		"update",
		"delete",
		"addAttachment",
	] as const)("%s: allowed only for the report owner while the report is editable", (action) => {
		expect(expensePolicy.can(action, owner, editableExpense)).toBe(true);
		expect(expensePolicy.can(action, owner, lockedExpense)).toBe(false);
		expect(expensePolicy.can(action, otherMember, editableExpense)).toBe(false);
		// Org admins get no write override — only read.
		expect(expensePolicy.can(action, admin, editableExpense)).toBe(false);
	});
});

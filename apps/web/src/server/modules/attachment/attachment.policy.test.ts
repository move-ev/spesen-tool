import { ReportStatus } from "@zemio/db";
import { describe, expect, it } from "vitest";
import { attachmentPolicy } from "./attachment.policy";

const owner = { userId: "owner_1", isOrgAdmin: false };
const otherMember = { userId: "member_2", isOrgAdmin: false };
const admin = { userId: "admin_1", isOrgAdmin: true };

const editableAttachment = {
	report: { ownerId: "owner_1", status: ReportStatus.DRAFT },
};
const lockedAttachment = {
	report: { ownerId: "owner_1", status: ReportStatus.PAID },
};

describe("attachmentPolicy.read", () => {
	it("allows the report owner and any org admin, denies other members", () => {
		expect(attachmentPolicy.can("read", owner, editableAttachment)).toBe(true);
		expect(attachmentPolicy.can("read", admin, editableAttachment)).toBe(true);
		expect(attachmentPolicy.can("read", otherMember, editableAttachment)).toBe(
			false,
		);
	});
});

describe("attachmentPolicy.delete", () => {
	it("allows only the report owner while the report is editable", () => {
		expect(attachmentPolicy.can("delete", owner, editableAttachment)).toBe(true);
		expect(attachmentPolicy.can("delete", owner, lockedAttachment)).toBe(false);
	});

	it("denies other members and org admins, even while editable", () => {
		expect(attachmentPolicy.can("delete", otherMember, editableAttachment)).toBe(
			false,
		);
		expect(attachmentPolicy.can("delete", admin, editableAttachment)).toBe(false);
	});
});

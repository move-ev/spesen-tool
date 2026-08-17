import { TRPCError } from "@trpc/server";
import { ReportStatus } from "@zemio/db";
import { describe, expect, it } from "vitest";
import {
	assertAdminTransition,
	assertSubmittable,
	canSubmit,
	isEditable,
} from "./report.state";

describe("isEditable", () => {
	it("is editable while DRAFT or NEEDS_REVISION", () => {
		expect(isEditable(ReportStatus.DRAFT)).toBe(true);
		expect(isEditable(ReportStatus.NEEDS_REVISION)).toBe(true);
	});

	it("is not editable once submitted, decided, or paid", () => {
		expect(isEditable(ReportStatus.PENDING_APPROVAL)).toBe(false);
		expect(isEditable(ReportStatus.ACCEPTED)).toBe(false);
		expect(isEditable(ReportStatus.REJECTED)).toBe(false);
		expect(isEditable(ReportStatus.PAID)).toBe(false);
	});
});

describe("canSubmit / assertSubmittable", () => {
	it("allows submission from DRAFT or NEEDS_REVISION", () => {
		expect(canSubmit(ReportStatus.DRAFT)).toBe(true);
		expect(canSubmit(ReportStatus.NEEDS_REVISION)).toBe(true);
		expect(() => assertSubmittable(ReportStatus.DRAFT)).not.toThrow();
	});

	it("rejects submission from any other status", () => {
		for (const status of [
			ReportStatus.PENDING_APPROVAL,
			ReportStatus.ACCEPTED,
			ReportStatus.REJECTED,
			ReportStatus.PAID,
		]) {
			expect(canSubmit(status)).toBe(false);
			expect(() => assertSubmittable(status)).toThrow(TRPCError);
			try {
				assertSubmittable(status);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("BAD_REQUEST");
			}
		}
	});
});

describe("assertAdminTransition", () => {
	it("does not throw for a legal transition", () => {
		expect(() =>
			assertAdminTransition(ReportStatus.PENDING_APPROVAL, ReportStatus.ACCEPTED),
		).not.toThrow();
	});

	it("throws BAD_REQUEST for an illegal transition", () => {
		expect(() =>
			assertAdminTransition(ReportStatus.DRAFT, ReportStatus.ACCEPTED),
		).toThrow(TRPCError);

		try {
			assertAdminTransition(ReportStatus.PAID, ReportStatus.DRAFT);
		} catch (error) {
			expect(error).toBeInstanceOf(TRPCError);
			expect((error as TRPCError).code).toBe("BAD_REQUEST");
		}
	});
});

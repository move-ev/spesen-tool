import { ReportStatus } from "@zemio/db";
import {
	asTRPCContext,
	createMockOrgContext,
	expectTRPCErrorCode,
} from "@zemio/test-utils";
import { describe, expect, it } from "vitest";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { reportProcedure } from "./report.procedure";

const testRouter = createTRPCRouter({
	update: reportProcedure("update").query(({ ctx }) => ({
		reportId: ctx.report.id,
	})),
	read: reportProcedure("read").query(({ ctx }) => ({
		reportId: ctx.report.id,
	})),
});
const createCaller = createCallerFactory(testRouter);

function caller(ctx: ReturnType<typeof createMockOrgContext>) {
	return createCaller(asTRPCContext(ctx));
}

describe("reportProcedure resource loading", () => {
	it("scopes the report lookup by id and the caller's active organizationId", async () => {
		const ctx = createMockOrgContext({ organizationId: "org_1" });
		ctx.db.report.findFirst.mockResolvedValue(null);

		await caller(ctx)
			.update({ id: "report_1" })
			.catch(() => {});

		expect(ctx.db.report.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					id: "report_1",
					organizationId: "org_1",
				}),
			}),
		);
	});

	it("throws NOT_FOUND when no report matches in the active org", async () => {
		const ctx = createMockOrgContext();
		ctx.db.report.findFirst.mockResolvedValue(null);

		await expectTRPCErrorCode(
			caller(ctx).update({ id: "report_1" }),
			"NOT_FOUND",
		);
	});
});

describe("reportProcedure authorization", () => {
	it("throws FORBIDDEN when a non-owner, non-admin member tries to update", async () => {
		const ctx = createMockOrgContext({ user: { id: "user_2" } });
		ctx.db.report.findFirst.mockResolvedValue({
			id: "report_1",
			ownerId: "owner_1",
			status: ReportStatus.DRAFT,
		} as never);

		await expectTRPCErrorCode(
			caller(ctx).update({ id: "report_1" }),
			"FORBIDDEN",
		);
	});

	it("throws FORBIDDEN when the owner tries to update a non-editable report", async () => {
		const ctx = createMockOrgContext({ user: { id: "owner_1" } });
		ctx.db.report.findFirst.mockResolvedValue({
			id: "report_1",
			ownerId: "owner_1",
			status: ReportStatus.PAID,
		} as never);

		await expectTRPCErrorCode(
			caller(ctx).update({ id: "report_1" }),
			"FORBIDDEN",
		);
	});

	it("succeeds and attaches ctx.report for the owner while the report is editable", async () => {
		const ctx = createMockOrgContext({ user: { id: "owner_1" } });
		ctx.db.report.findFirst.mockResolvedValue({
			id: "report_1",
			ownerId: "owner_1",
			status: ReportStatus.DRAFT,
		} as never);

		const result = await caller(ctx).update({ id: "report_1" });

		expect(result).toEqual({ reportId: "report_1" });
	});

	it("allows an org admin to read a report they don't own", async () => {
		const ctx = createMockOrgContext({
			user: { id: "admin_1" },
			member: { role: "admin" },
		});
		ctx.db.report.findFirst.mockResolvedValue({
			id: "report_1",
			ownerId: "owner_1",
			status: ReportStatus.PENDING_APPROVAL,
		} as never);

		const result = await caller(ctx).read({ id: "report_1" });

		expect(result).toEqual({ reportId: "report_1" });
	});

	it("denies a non-admin, non-owner member from reading the report", async () => {
		const ctx = createMockOrgContext({
			user: { id: "user_2" },
			member: { role: "member" },
		});
		ctx.db.report.findFirst.mockResolvedValue({
			id: "report_1",
			ownerId: "owner_1",
			status: ReportStatus.PENDING_APPROVAL,
		} as never);

		await expectTRPCErrorCode(caller(ctx).read({ id: "report_1" }), "FORBIDDEN");
	});
});

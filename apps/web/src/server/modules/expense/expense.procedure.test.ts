import { ReportStatus } from "@zemio/db";
import {
	asTRPCContext,
	createMockOrgContext,
	expectTRPCErrorCode,
} from "@zemio/test-utils";
import { describe, expect, it } from "vitest";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { expenseProcedure } from "./expense.procedure";

const testRouter = createTRPCRouter({
	read: expenseProcedure("read").query(({ ctx }) => ({ id: ctx.expense.id })),
	update: expenseProcedure("update").query(({ ctx }) => ({
		id: ctx.expense.id,
	})),
});
const createCaller = createCallerFactory(testRouter);

function caller(ctx: ReturnType<typeof createMockOrgContext>) {
	return createCaller(asTRPCContext(ctx));
}

describe("expenseProcedure", () => {
	it("throws NOT_FOUND when the expense doesn't exist", async () => {
		const ctx = createMockOrgContext();
		ctx.db.expense.findUnique.mockResolvedValue(null);

		await expectTRPCErrorCode(caller(ctx).read({ id: "expense_1" }), "NOT_FOUND");
	});

	it("throws NOT_FOUND when the expense's report belongs to a different organization", async () => {
		// expenseRepository.findById doesn't filter by organizationId at the query
		// level — the procedure must reject a cross-tenant expense id itself.
		const ctx = createMockOrgContext({ organizationId: "org_1" });
		ctx.db.expense.findUnique.mockResolvedValue({
			id: "expense_1",
			report: {
				ownerId: "owner_1",
				organizationId: "org_2",
				status: ReportStatus.DRAFT,
			},
		} as never);

		await expectTRPCErrorCode(caller(ctx).read({ id: "expense_1" }), "NOT_FOUND");
	});

	it("throws FORBIDDEN when a non-owner, non-admin member tries to update", async () => {
		const ctx = createMockOrgContext({
			organizationId: "org_1",
			user: { id: "user_2" },
		});
		ctx.db.expense.findUnique.mockResolvedValue({
			id: "expense_1",
			report: {
				ownerId: "owner_1",
				organizationId: "org_1",
				status: ReportStatus.DRAFT,
			},
		} as never);

		await expectTRPCErrorCode(
			caller(ctx).update({ id: "expense_1" }),
			"FORBIDDEN",
		);
	});

	it("throws FORBIDDEN when the owner tries to update an expense on a non-editable report", async () => {
		const ctx = createMockOrgContext({
			organizationId: "org_1",
			user: { id: "owner_1" },
		});
		ctx.db.expense.findUnique.mockResolvedValue({
			id: "expense_1",
			report: {
				ownerId: "owner_1",
				organizationId: "org_1",
				status: ReportStatus.ACCEPTED,
			},
		} as never);

		await expectTRPCErrorCode(
			caller(ctx).update({ id: "expense_1" }),
			"FORBIDDEN",
		);
	});

	it("succeeds for the owner while the report is editable", async () => {
		const ctx = createMockOrgContext({
			organizationId: "org_1",
			user: { id: "owner_1" },
		});
		ctx.db.expense.findUnique.mockResolvedValue({
			id: "expense_1",
			report: {
				ownerId: "owner_1",
				organizationId: "org_1",
				status: ReportStatus.DRAFT,
			},
		} as never);

		const result = await caller(ctx).update({ id: "expense_1" });

		expect(result).toEqual({ id: "expense_1" });
	});

	it("allows an org admin to read but not update another member's expense", async () => {
		const ctx = createMockOrgContext({
			organizationId: "org_1",
			user: { id: "admin_1" },
			member: { role: "admin" },
		});
		ctx.db.expense.findUnique.mockResolvedValue({
			id: "expense_1",
			report: {
				ownerId: "owner_1",
				organizationId: "org_1",
				status: ReportStatus.PENDING_APPROVAL,
			},
		} as never);

		const readResult = await caller(ctx).read({ id: "expense_1" });
		expect(readResult).toEqual({ id: "expense_1" });

		await expectTRPCErrorCode(
			caller(ctx).update({ id: "expense_1" }),
			"FORBIDDEN",
		);
	});
});

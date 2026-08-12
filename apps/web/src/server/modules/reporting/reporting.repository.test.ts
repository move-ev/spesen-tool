import { ReportStatus } from "@zemio/db";
import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

// reportingRepository only calls reportRepository.sumByReportIds; mocking the
// barrel here avoids pulling in the report module's email templates (and
// their @zemio/i18n -> next-intl -> next/headers chain, which needs a real
// Next.js runtime). reportRepository's own behavior is covered directly in
// report.repository.test.ts.
vi.mock("@/server/modules/report", () => ({
	reportRepository: { sumByReportIds: vi.fn() },
}));

const { reportRepository } = await import("@/server/modules/report");
const { reportingRepository } = await import("./reporting.repository");

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("reportingRepository.matchingReports", () => {
	it("passes the caller-built where clause through", async () => {
		db.report.findMany.mockResolvedValue([]);

		const where = { organizationId: "org_1" };
		await reportingRepository.matchingReports(db, where);

		expect(db.report.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where }),
		);
	});
});

describe("reportingRepository.expenseSumsByReport", () => {
	it("maps grouped sums into a reportId -> number map, defaulting null sums to 0", async () => {
		vi
			.mocked(reportRepository.sumByReportIds)
			.mockResolvedValue([
				{ reportId: "report_1", _sum: { amount: null } },
			] as never);

		const result = await reportingRepository.expenseSumsByReport(db, [
			"report_1",
		]);

		expect(result.get("report_1")).toBe(0);
	});
});

describe("reportingRepository.byExpenseType", () => {
	it("wraps the report where clause and maps sum/count per type", async () => {
		// `groupBy`'s heavily overloaded generic signature loses the mock's
		// static type; the underlying function is still a real vi.fn().
		(db.expense.groupBy as unknown as Mock).mockResolvedValue([
			{ type: "TRAVEL", _sum: { amount: null }, _count: 2 },
		]);

		const where = { organizationId: "org_1" };
		const result = await reportingRepository.byExpenseType(db, where);

		expect(db.expense.groupBy).toHaveBeenCalledWith(
			expect.objectContaining({ where: { report: where } }),
		);
		expect(result).toEqual([{ type: "TRAVEL", amount: 0, count: 2 }]);
	});
});

describe("reportingRepository.submittedSeries / reimbursedSeries", () => {
	it("submittedSeries scopes the raw query to the given organization and date range", async () => {
		db.$queryRaw.mockResolvedValue([]);

		const from = new Date("2026-01-01T00:00:00.000Z");
		const to = new Date("2026-01-31T00:00:00.000Z");
		await reportingRepository.submittedSeries(db, {
			organizationId: "org_1",
			from,
			to,
			granularity: "month",
		});

		expect(db.$queryRaw).toHaveBeenCalledTimes(1);
		const values =
			(db.$queryRaw as unknown as { mock: { calls: unknown[][] } }).mock
				.calls[0] ?? [];
		expect(values).toContain("org_1");
		expect(values).toContain(from);
		expect(values).toContain(to);
	});

	it("reimbursedSeries scopes the raw query to PAID reports in the date range", async () => {
		db.$queryRaw.mockResolvedValue([]);

		const from = new Date("2026-01-01T00:00:00.000Z");
		const to = new Date("2026-01-31T00:00:00.000Z");
		await reportingRepository.reimbursedSeries(db, {
			organizationId: "org_1",
			from,
			to,
			granularity: "day",
		});

		const values =
			(db.$queryRaw as unknown as { mock: { calls: unknown[][] } }).mock
				.calls[0] ?? [];
		expect(values).toContain("org_1");
		expect(values).toContain(from);
		expect(values).toContain(to);
	});
});

describe("reportingRepository.submittedTotal / reimbursedTotal", () => {
	it("submittedTotal scopes by organization and createdAt range, defaulting null to 0", async () => {
		db.expense.aggregate.mockResolvedValue({ _sum: { amount: null } } as never);

		const from = new Date("2026-01-01T00:00:00.000Z");
		const to = new Date("2026-01-31T00:00:00.000Z");
		const result = await reportingRepository.submittedTotal(db, {
			organizationId: "org_1",
			from,
			to,
		});

		expect(result).toBe(0);
		expect(db.expense.aggregate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					report: {
						organizationId: "org_1",
						createdAt: { gte: from, lte: to },
					},
				},
			}),
		);
	});

	it("reimbursedTotal additionally restricts to PAID reports", async () => {
		db.expense.aggregate.mockResolvedValue({
			_sum: { amount: null },
		} as never);

		const from = new Date("2026-01-01T00:00:00.000Z");
		const to = new Date("2026-01-31T00:00:00.000Z");
		await reportingRepository.reimbursedTotal(db, {
			organizationId: "org_1",
			from,
			to,
		});

		expect(db.expense.aggregate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					report: {
						organizationId: "org_1",
						status: ReportStatus.PAID,
						paidAt: { gte: from, lte: to },
					},
				},
			}),
		);
	});
});

describe("reportingRepository.exportRows", () => {
	it("flattens nested report/expense rows into export rows", async () => {
		const startDate = new Date("2026-01-05T00:00:00.000Z");
		const endDate = new Date("2026-01-06T00:00:00.000Z");
		db.expense.findMany.mockResolvedValue([
			{
				id: "expense_1",
				type: "RECEIPT",
				description: "Taxi",
				amount: 12.5,
				startDate,
				endDate,
				report: {
					id: "report_1",
					tag: 7,
					title: "Trip",
					status: ReportStatus.ACCEPTED,
					owner: { name: "Ada Lovelace" },
					costUnit: { tag: "CU-1", title: "Marketing" },
				},
			},
		] as never);

		const result = await reportingRepository.exportRows(db, {
			organizationId: "org_1",
		});

		expect(result).toEqual([
			{
				reportId: "report_1",
				reportTag: 7,
				reportTitle: "Trip",
				reportStatus: ReportStatus.ACCEPTED,
				ownerName: "Ada Lovelace",
				costUnitTag: "CU-1",
				costUnitTitle: "Marketing",
				expenseId: "expense_1",
				expenseType: "RECEIPT",
				expenseDescription: "Taxi",
				expenseAmount: 12.5,
				expenseStartDate: startDate,
				expenseEndDate: endDate,
			},
		]);
	});
});

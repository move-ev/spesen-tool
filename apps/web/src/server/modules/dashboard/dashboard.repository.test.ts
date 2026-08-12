import { ReportStatus } from "@zemio/db";
import {
	createMockDb,
	type MockPrismaClient,
	readRawQueryCall,
} from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { dashboardRepository } from "./dashboard.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

const from = new Date("2026-01-01T00:00:00.000Z");
const to = new Date("2026-01-31T00:00:00.000Z");

describe("dashboardRepository.submittedSeries / reimbursedSeries", () => {
	// The first interpolated value is the DATE_TRUNC granularity fragment
	// (`Prisma.raw`), not a bind parameter; the tenancy/date bindings follow it.
	const bindings = (call: { values: unknown[] }) => call.values.slice(1);

	it("submittedSeries binds owner, organization, and createdAt range in order", async () => {
		db.$queryRaw.mockResolvedValue([]);

		await dashboardRepository.submittedSeries(db, {
			organizationId: "org_1",
			userId: "user_1",
			from,
			to,
			granularity: "month",
		});

		const call = readRawQueryCall(db);
		expect(bindings(call)).toEqual(["user_1", "org_1", from, to]);
		// Guards the columns those first two bindings land in, so swapping the
		// column names alone still fails.
		expect(call.sql).toMatch(/"ownerId" = \?[\s\S]*"organizationId" = \?/);
		expect(call.sql).toContain('r."createdAt"');
	});

	it("reimbursedSeries binds owner, organization, and paidAt range, restricted to PAID", async () => {
		db.$queryRaw.mockResolvedValue([]);

		await dashboardRepository.reimbursedSeries(db, {
			organizationId: "org_1",
			userId: "user_1",
			from,
			to,
			granularity: "day",
		});

		const call = readRawQueryCall(db);
		expect(bindings(call)).toEqual(["user_1", "org_1", from, to]);
		// Guards the columns those first two bindings land in, so swapping the
		// column names alone still fails.
		expect(call.sql).toMatch(/"ownerId" = \?[\s\S]*"organizationId" = \?/);
		expect(call.sql).toContain("PAID");
		expect(call.sql).toContain('r."paidAt"');
	});
});

describe("dashboardRepository.submittedTotal / reimbursedTotal", () => {
	it("submittedTotal scopes by owner, organization, and date range", async () => {
		db.expense.aggregate.mockResolvedValue({ _sum: { amount: null } } as never);

		const result = await dashboardRepository.submittedTotal(db, {
			organizationId: "org_1",
			userId: "user_1",
			from,
			to,
			granularity: "month",
		});

		expect(result).toBe(0);
		expect(db.expense.aggregate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					report: {
						ownerId: "user_1",
						organizationId: "org_1",
						createdAt: { gte: from, lte: to },
					},
				},
			}),
		);
	});

	it("reimbursedTotal additionally restricts to PAID reports", async () => {
		db.expense.aggregate.mockResolvedValue({ _sum: { amount: null } } as never);

		await dashboardRepository.reimbursedTotal(db, {
			organizationId: "org_1",
			userId: "user_1",
			from,
			to,
			granularity: "month",
		});

		expect(db.expense.aggregate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					report: {
						ownerId: "user_1",
						organizationId: "org_1",
						status: ReportStatus.PAID,
						paidAt: { gte: from, lte: to },
					},
				},
			}),
		);
	});
});

describe("dashboardRepository.createdCount / acceptedCount", () => {
	it("createdCount scopes by owner, organization, and createdAt since", async () => {
		db.report.count.mockResolvedValue(3);

		const result = await dashboardRepository.createdCount(db, {
			organizationId: "org_1",
			userId: "user_1",
			from,
		});

		expect(result).toBe(3);
		expect(db.report.count).toHaveBeenCalledWith({
			where: {
				ownerId: "user_1",
				organizationId: "org_1",
				createdAt: { gte: from },
			},
		});
	});

	it("acceptedCount additionally restricts to ACCEPTED reports by lastUpdatedAt", async () => {
		db.report.count.mockResolvedValue(1);

		await dashboardRepository.acceptedCount(db, {
			organizationId: "org_1",
			userId: "user_1",
			from,
		});

		expect(db.report.count).toHaveBeenCalledWith({
			where: {
				ownerId: "user_1",
				organizationId: "org_1",
				status: ReportStatus.ACCEPTED,
				lastUpdatedAt: { gte: from },
			},
		});
	});
});

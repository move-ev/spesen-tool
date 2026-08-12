import { ReportStatus } from "@zemio/db";
import {
	createMockDb,
	createReportFixture,
	type MockPrismaClient,
} from "@zemio/test-utils";
import { beforeEach, describe, expect, it, type Mock } from "vitest";
import { reportRepository } from "./report.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("reportRepository.findById", () => {
	it("scopes the lookup by id and organizationId", async () => {
		db.report.findFirst.mockResolvedValue(createReportFixture() as never);

		await reportRepository.findById(db, {
			id: "report_1",
			organizationId: "org_1",
		});

		expect(db.report.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "report_1", organizationId: "org_1" },
			}),
		);
	});
});

describe("reportRepository.listPage", () => {
	it("passes the caller-built where/orderBy/take/skip straight through", async () => {
		db.report.findMany.mockResolvedValue([]);

		const args = {
			where: { organizationId: "org_1" },
			orderBy: { createdAt: "desc" as const },
			take: 20,
			skip: 0,
		};
		await reportRepository.listPage(db, args);

		expect(db.report.findMany).toHaveBeenCalledWith(
			expect.objectContaining(args),
		);
	});
});

describe("reportRepository.count", () => {
	it("counts using the given where clause", async () => {
		db.report.count.mockResolvedValue(3);

		const result = await reportRepository.count(db, { organizationId: "org_1" });

		expect(result).toBe(3);
		expect(db.report.count).toHaveBeenCalledWith({
			where: { organizationId: "org_1" },
		});
	});
});

describe("reportRepository.sumByReportIds", () => {
	it("returns an empty array without querying when given no ids", async () => {
		const result = await reportRepository.sumByReportIds(db, []);

		expect(result).toEqual([]);
		expect(db.expense.groupBy).not.toHaveBeenCalled();
	});

	it("groups expense sums by reportId when ids are given", async () => {
		// `groupBy`'s heavily overloaded generic signature loses the mock's
		// static type; the underlying function is still a real vi.fn().
		(db.expense.groupBy as unknown as Mock).mockResolvedValue([
			{ reportId: "report_1", _sum: { amount: null } },
		]);

		await reportRepository.sumByReportIds(db, ["report_1", "report_2"]);

		expect(db.expense.groupBy).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { reportId: { in: ["report_1", "report_2"] } },
			}),
		);
	});
});

describe("reportRepository.reviewDetail", () => {
	it("scopes the lookup by id and organizationId", async () => {
		db.report.findFirst.mockResolvedValue(null);

		await reportRepository.reviewDetail(db, {
			id: "report_1",
			organizationId: "org_1",
		});

		expect(db.report.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "report_1", organizationId: "org_1" },
			}),
		);
	});
});

describe("reportRepository.financialSummary", () => {
	it("scopes both the report lookup and the expense aggregate by organizationId", async () => {
		db.$transaction.mockImplementation(
			(ops: unknown) => Promise.all(ops as Promise<unknown>[]) as never,
		);
		db.report.findFirst.mockResolvedValue({
			ownerId: "owner_1",
			status: ReportStatus.ACCEPTED,
			bankingDetails: null,
			bankingSnapshot: null,
		} as never);
		db.expense.aggregate.mockResolvedValue({
			_sum: { amount: null },
		} as never);

		const result = await reportRepository.financialSummary(db, {
			id: "report_1",
			organizationId: "org_1",
		});

		expect(db.report.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "report_1", organizationId: "org_1" },
			}),
		);
		expect(db.expense.aggregate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					reportId: "report_1",
					report: { organizationId: "org_1" },
				},
			}),
		);
		expect(result.report?.ownerId).toBe("owner_1");
	});
});

describe("reportRepository.findBankingDetailsOwner", () => {
	it("looks up the banking details owner by id", async () => {
		db.bankingDetails.findUnique.mockResolvedValue({
			userId: "owner_1",
		} as never);

		const result = await reportRepository.findBankingDetailsOwner(
			db,
			"banking_1",
		);

		expect(result).toEqual({ userId: "owner_1" });
		expect(db.bankingDetails.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "banking_1" } }),
		);
	});
});

describe("reportRepository.snapshotBankingDetails", () => {
	it("returns false without upserting when the banking details no longer exist", async () => {
		db.bankingDetails.findUnique.mockResolvedValue(null);

		const result = await reportRepository.snapshotBankingDetails(db, {
			reportId: "report_1",
			bankingDetailsId: "banking_1",
		});

		expect(result).toBe(false);
		expect(db.reportBankingSnapshot.upsert).not.toHaveBeenCalled();
	});

	it("upserts the snapshot with the encrypted values when found", async () => {
		const details = { iban: "enc-iban", fullName: "enc-name" };
		db.bankingDetails.findUnique.mockResolvedValue(details as never);

		const result = await reportRepository.snapshotBankingDetails(db, {
			reportId: "report_1",
			bankingDetailsId: "banking_1",
		});

		expect(result).toBe(true);
		expect(db.reportBankingSnapshot.upsert).toHaveBeenCalledWith({
			where: { reportId: "report_1" },
			create: { reportId: "report_1", ...details },
			update: details,
		});
	});
});

describe("reportRepository.findCostUnit", () => {
	it("scopes the lookup by id and organizationId", async () => {
		db.costUnit.findFirst.mockResolvedValue(null);

		await reportRepository.findCostUnit(db, {
			id: "cost_unit_1",
			organizationId: "org_1",
		});

		expect(db.costUnit.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "cost_unit_1", organizationId: "org_1" },
			}),
		);
	});
});

describe("reportRepository.findReviewerEmail", () => {
	it("looks up settings scoped by organizationId", async () => {
		db.settings.findUnique.mockResolvedValue({
			reviewerEmail: "reviewer@example.com",
		} as never);

		const result = await reportRepository.findReviewerEmail(db, "org_1");

		expect(result).toEqual({ reviewerEmail: "reviewer@example.com" });
		expect(db.settings.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { organizationId: "org_1" } }),
		);
	});
});

describe("reportRepository.create / update / setStatus / remove", () => {
	it("create() passes the data through and selects only the id", async () => {
		db.report.create.mockResolvedValue({ id: "report_1" } as never);

		const data = {
			title: "Trip",
			organizationId: "org_1",
			costUnitId: "cu_1",
			ownerId: "user_1",
		};
		await reportRepository.create(db, data as never);

		expect(db.report.create).toHaveBeenCalledWith({
			data,
			select: { id: true },
		});
	});

	it("update() updates by id with the given fields", async () => {
		db.report.update.mockResolvedValue({ id: "report_1" } as never);

		await reportRepository.update(db, {
			id: "report_1",
			data: { title: "New title" },
		});

		expect(db.report.update).toHaveBeenCalledWith({
			where: { id: "report_1" },
			data: { title: "New title" },
			select: { id: true },
		});
	});

	it("setStatus() updates status and paidAt by id", async () => {
		db.report.update.mockResolvedValue({
			id: "report_1",
			status: ReportStatus.PAID,
		} as never);

		const paidAt = new Date("2026-02-01T00:00:00.000Z");
		await reportRepository.setStatus(db, {
			id: "report_1",
			status: ReportStatus.PAID,
			paidAt,
		});

		expect(db.report.update).toHaveBeenCalledWith({
			where: { id: "report_1" },
			data: { status: ReportStatus.PAID, paidAt },
			select: { id: true, status: true },
		});
	});

	it("remove() deletes by id", async () => {
		db.report.delete.mockResolvedValue({ id: "report_1" } as never);

		await reportRepository.remove(db, "report_1");

		expect(db.report.delete).toHaveBeenCalledWith({
			where: { id: "report_1" },
			select: { id: true },
		});
	});
});

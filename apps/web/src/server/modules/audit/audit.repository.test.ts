import { Prisma } from "@zemio/db";
import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { auditRepository } from "./audit.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("auditRepository.append", () => {
	it("stores a null diff/payload as Prisma.DbNull rather than JSON null", async () => {
		db.auditEvent.create.mockResolvedValue({ id: "event_1" } as never);

		await auditRepository.append(db, {
			organizationId: "org_1",
			actorId: "user_1",
			entityId: "report_1",
			action: "report.created",
			entityType: "report",
			diff: null,
			payload: null,
		} as never);

		expect(db.auditEvent.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					diff: Prisma.DbNull,
					payload: Prisma.DbNull,
				}),
			}),
		);
	});

	it("passes a present diff/payload through as-is", async () => {
		db.auditEvent.create.mockResolvedValue({ id: "event_1" } as never);

		const payload = {
			title: "Trip",
			costUnitId: "cu_1",
			bankingDetailsId: "bd_1",
		};
		await auditRepository.append(db, {
			organizationId: "org_1",
			actorId: "user_1",
			entityId: "report_1",
			action: "report.created",
			entityType: "report",
			diff: null,
			payload,
		} as never);

		expect(db.auditEvent.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ payload }),
			}),
		);
	});
});

describe("auditRepository.listPage", () => {
	function makeRow(id: string) {
		return { id, createdAt: new Date("2026-01-01T00:00:00.000Z") };
	}

	it("returns no next cursor when fewer rows than the page size come back", async () => {
		db.auditEvent.findMany.mockResolvedValue([
			makeRow("1"),
			makeRow("2"),
		] as never);

		const result = await auditRepository.listPage(db, {
			where: { organizationId: "org_1" },
			take: 5,
		});

		expect(result.items).toHaveLength(2);
		expect(result.nextCursor).toBeNull();
		expect(db.auditEvent.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ take: 6, skip: 0, cursor: undefined }),
		);
	});

	it("trims the extra lookahead row and returns its id as the next cursor", async () => {
		db.auditEvent.findMany.mockResolvedValue([
			makeRow("1"),
			makeRow("2"),
			makeRow("3"),
		] as never);

		const result = await auditRepository.listPage(db, {
			where: { organizationId: "org_1" },
			take: 2,
		});

		expect(result.items.map((i) => i.id)).toEqual(["1", "2"]);
		expect(result.nextCursor).toBe("2");
	});

	it("paginates from the given cursor", async () => {
		db.auditEvent.findMany.mockResolvedValue([]);

		await auditRepository.listPage(db, {
			where: { organizationId: "org_1" },
			take: 5,
			cursor: "event_5",
		});

		expect(db.auditEvent.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ cursor: { id: "event_5" }, skip: 1 }),
		);
	});
});

describe("auditRepository.findReportEntityIds", () => {
	it("flattens the report id, expense ids, and their attachment ids", async () => {
		db.expense.findMany.mockResolvedValue([
			{ id: "expense_1", attachments: [{ id: "att_1" }, { id: "att_2" }] },
			{ id: "expense_2", attachments: [] },
		] as never);

		const result = await auditRepository.findReportEntityIds(db, {
			reportId: "report_1",
			organizationId: "org_1",
		});

		expect(result).toEqual([
			"report_1",
			"expense_1",
			"expense_2",
			"att_1",
			"att_2",
		]);
		expect(db.expense.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					reportId: "report_1",
					report: { organizationId: "org_1" },
				},
			}),
		);
	});
});

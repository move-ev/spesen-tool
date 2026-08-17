import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { attachmentRepository } from "./attachment.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("attachmentRepository.findById", () => {
	it("looks up by id", async () => {
		db.attachment.findUnique.mockResolvedValue(null);

		await attachmentRepository.findById(db, "att_1");

		expect(db.attachment.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "att_1" } }),
		);
	});
});

describe("attachmentRepository.listForExpense / listForReport", () => {
	it("listForExpense filters by expenseId", async () => {
		db.attachment.findMany.mockResolvedValue([]);

		await attachmentRepository.listForExpense(db, "expense_1");

		expect(db.attachment.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { expenseId: "expense_1" } }),
		);
	});

	it("listForReport filters via the expense's reportId", async () => {
		db.attachment.findMany.mockResolvedValue([]);

		await attachmentRepository.listForReport(db, "report_1");

		expect(db.attachment.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { expense: { reportId: "report_1" } },
			}),
		);
	});
});

describe("attachmentRepository.findManyByIds", () => {
	it("scopes by organizationId through the expense/report relation", async () => {
		db.attachment.findMany.mockResolvedValue([]);

		await attachmentRepository.findManyByIds(db, {
			ids: ["att_1", "att_2"],
			organizationId: "org_1",
		});

		expect(db.attachment.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id: { in: ["att_1", "att_2"] },
					expense: { report: { organizationId: "org_1" } },
				},
			}),
		);
	});
});

describe("attachmentRepository.countForExpense", () => {
	it("counts by expenseId", async () => {
		db.attachment.count.mockResolvedValue(2);

		const result = await attachmentRepository.countForExpense(db, "expense_1");

		expect(result).toBe(2);
		expect(db.attachment.count).toHaveBeenCalledWith({
			where: { expenseId: "expense_1" },
		});
	});
});

describe("attachmentRepository.createMany", () => {
	it("creates one row per item", async () => {
		db.attachment.create.mockResolvedValue({} as never);

		const data = [
			{ expenseId: "expense_1", key: "k1", size: 10, originalName: "a.pdf" },
			{ expenseId: "expense_1", key: "k2", size: 20, originalName: "b.pdf" },
		];
		await attachmentRepository.createMany(db, data);

		expect(db.attachment.create).toHaveBeenCalledTimes(2);
		expect(db.attachment.create).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({ data: data[0] }),
		);
		expect(db.attachment.create).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ data: data[1] }),
		);
	});
});

describe("attachmentRepository.remove", () => {
	it("deletes by id", async () => {
		db.attachment.delete.mockResolvedValue({ id: "att_1" } as never);

		await attachmentRepository.remove(db, "att_1");

		expect(db.attachment.delete).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "att_1" } }),
		);
	});
});

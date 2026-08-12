import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { expenseRepository } from "./expense.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("expenseRepository.findById / listForReport", () => {
	it("findById looks up by id", async () => {
		db.expense.findUnique.mockResolvedValue(null);

		await expenseRepository.findById(db, "expense_1");

		expect(db.expense.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "expense_1" } }),
		);
	});

	it("listForReport filters by reportId", async () => {
		db.expense.findMany.mockResolvedValue([]);

		await expenseRepository.listForReport(db, "report_1");

		expect(db.expense.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { reportId: "report_1" } }),
		);
	});
});

describe("expenseRepository.findReport", () => {
	it("scopes the lookup by id and organizationId", async () => {
		db.report.findFirst.mockResolvedValue(null);

		await expenseRepository.findReport(db, {
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

describe("expenseRepository.findSettings", () => {
	it("looks up settings by organizationId", async () => {
		db.settings.findUnique.mockResolvedValue(null);

		await expenseRepository.findSettings(db, "org_1");

		expect(db.settings.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { organizationId: "org_1" } }),
		);
	});
});

describe("expenseRepository.create / update / remove", () => {
	it("create() passes the data through", async () => {
		db.expense.create.mockResolvedValue({ id: "expense_1" } as never);

		const data = { reportId: "report_1", type: "RECEIPT", amount: 10 };
		await expenseRepository.create(db, data as never);

		expect(db.expense.create).toHaveBeenCalledWith({
			data,
			select: { id: true },
		});
	});

	it("update() updates by id", async () => {
		db.expense.update.mockResolvedValue({ id: "expense_1" } as never);

		await expenseRepository.update(db, {
			id: "expense_1",
			data: { description: "Updated" } as never,
		});

		expect(db.expense.update).toHaveBeenCalledWith({
			where: { id: "expense_1" },
			data: { description: "Updated" },
			select: { id: true },
		});
	});

	it("remove() deletes by id", async () => {
		db.expense.delete.mockResolvedValue({ id: "expense_1" } as never);

		await expenseRepository.remove(db, "expense_1");

		expect(db.expense.delete).toHaveBeenCalledWith({
			where: { id: "expense_1" },
			select: { id: true },
		});
	});
});

describe("expenseRepository.findAttachmentKeys", () => {
	it("maps attachments down to their storage keys", async () => {
		db.attachment.findMany.mockResolvedValue([
			{ key: "key-1" },
			{ key: "key-2" },
		] as never);

		const result = await expenseRepository.findAttachmentKeys(db, "expense_1");

		expect(result).toEqual(["key-1", "key-2"]);
		expect(db.attachment.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { expenseId: "expense_1" } }),
		);
	});
});

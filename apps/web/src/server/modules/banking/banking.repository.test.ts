import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { bankingRepository } from "./banking.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("bankingRepository.findById", () => {
	it("looks up by id", async () => {
		db.bankingDetails.findUnique.mockResolvedValue(null);

		await bankingRepository.findById(db, "bd_1");

		expect(db.bankingDetails.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "bd_1" } }),
		);
	});
});

describe("bankingRepository.listForUser", () => {
	it("scopes by userId — banking details are user-owned, not org-scoped", async () => {
		db.bankingDetails.findMany.mockResolvedValue([]);

		await bankingRepository.listForUser(db, "user_1");

		expect(db.bankingDetails.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { userId: "user_1" } }),
		);
	});
});

describe("bankingRepository.create / update / remove", () => {
	const encrypted = { iban: "enc-iban", fullName: "enc-name" };

	it("create() stores the encrypted fields under the given userId", async () => {
		db.bankingDetails.create.mockResolvedValue({ id: "bd_1" } as never);

		await bankingRepository.create(db, {
			userId: "user_1",
			title: "Main account",
			encrypted,
		});

		expect(db.bankingDetails.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { title: "Main account", userId: "user_1", ...encrypted },
			}),
		);
	});

	it("update() updates by id with the encrypted fields", async () => {
		db.bankingDetails.update.mockResolvedValue({ id: "bd_1" } as never);

		await bankingRepository.update(db, {
			id: "bd_1",
			title: "Renamed",
			encrypted,
		});

		expect(db.bankingDetails.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "bd_1" },
				data: { title: "Renamed", ...encrypted },
			}),
		);
	});

	it("remove() deletes by id", async () => {
		db.bankingDetails.delete.mockResolvedValue({ id: "bd_1" } as never);

		await bankingRepository.remove(db, "bd_1");

		expect(db.bankingDetails.delete).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "bd_1" } }),
		);
	});
});

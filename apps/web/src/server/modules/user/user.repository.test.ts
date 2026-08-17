import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { userRepository } from "./user.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("userRepository.findById", () => {
	it("looks up by id", async () => {
		db.user.findUnique.mockResolvedValue(null);

		await userRepository.findById(db, "user_1");

		expect(db.user.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "user_1" } }),
		);
	});
});

describe("userRepository.updateName", () => {
	it("updates the name by id", async () => {
		db.user.update.mockResolvedValue({ id: "user_1" } as never);

		await userRepository.updateName(db, { id: "user_1", name: "Ada Lovelace" });

		expect(db.user.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "user_1" },
				data: { name: "Ada Lovelace" },
			}),
		);
	});
});

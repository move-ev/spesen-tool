import { NotificationPreference } from "@zemio/db";
import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { preferencesRepository } from "./preferences.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("preferencesRepository.upsert", () => {
	it("defaults notifications to ALL on first creation when none are given", async () => {
		db.preferences.upsert.mockResolvedValue({} as never);

		await preferencesRepository.upsert(db, { userId: "user_1" });

		expect(db.preferences.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "user_1" },
				create: { userId: "user_1", notifications: NotificationPreference.ALL },
			}),
		);
	});

	it("uses the given notifications preference on creation", async () => {
		db.preferences.upsert.mockResolvedValue({} as never);

		await preferencesRepository.upsert(db, {
			userId: "user_1",
			notifications: NotificationPreference.NONE,
		});

		expect(db.preferences.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: {
					userId: "user_1",
					notifications: NotificationPreference.NONE,
				},
			}),
		);
	});

	it("leaves the update a no-op when no notifications are given (read-only upsert)", async () => {
		db.preferences.upsert.mockResolvedValue({} as never);

		await preferencesRepository.upsert(db, { userId: "user_1" });

		expect(db.preferences.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: {} }),
		);
	});

	it("updates notifications when given", async () => {
		db.preferences.upsert.mockResolvedValue({} as never);

		await preferencesRepository.upsert(db, {
			userId: "user_1",
			notifications: NotificationPreference.NONE,
		});

		expect(db.preferences.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				update: { notifications: NotificationPreference.NONE },
			}),
		);
	});
});

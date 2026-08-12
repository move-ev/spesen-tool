import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { settingsRepository } from "./settings.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("settingsRepository.upsert", () => {
	it("seeds the default kilometer rate on creation, overridable by given data", async () => {
		db.settings.upsert.mockResolvedValue({} as never);

		await settingsRepository.upsert(db, {
			organizationId: "org_1",
			data: { reviewerEmail: "reviewer@example.com" },
		});

		expect(db.settings.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { organizationId: "org_1" },
				create: {
					organizationId: "org_1",
					kilometerRate: 0.3,
					reviewerEmail: "reviewer@example.com",
				},
			}),
		);
	});

	it("does not inject the default kilometer rate into the update branch", async () => {
		db.settings.upsert.mockResolvedValue({} as never);

		await settingsRepository.upsert(db, {
			organizationId: "org_1",
			data: { reviewerEmail: "reviewer@example.com" },
		});

		expect(db.settings.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				update: { reviewerEmail: "reviewer@example.com" },
			}),
		);
	});

	it("lets explicit data override the default kilometer rate on creation", async () => {
		db.settings.upsert.mockResolvedValue({} as never);

		await settingsRepository.upsert(db, {
			organizationId: "org_1",
			data: { kilometerRate: 0.42 },
		});

		expect(db.settings.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				create: expect.objectContaining({ kilometerRate: 0.42 }),
			}),
		);
	});
});

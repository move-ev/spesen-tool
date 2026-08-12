import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationRepository } from "./organization.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("organizationRepository.findById / findDetailById / listAll", () => {
	it("findById looks up by id", async () => {
		db.organization.findUnique.mockResolvedValue(null);

		await organizationRepository.findById(db, "org_1");

		expect(db.organization.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "org_1" } }),
		);
	});

	it("findDetailById looks up by id", async () => {
		db.organization.findUnique.mockResolvedValue(null);

		await organizationRepository.findDetailById(db, "org_1");

		expect(db.organization.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "org_1" } }),
		);
	});

	it("listAll has no tenant filter — it is a platform-scoped query", async () => {
		db.organization.findMany.mockResolvedValue([]);

		await organizationRepository.listAll(db);

		const call = db.organization.findMany.mock.calls[0]?.[0];
		expect(call).not.toHaveProperty("where");
	});
});

describe("organizationRepository.findConflictingSlug", () => {
	it("checks the slug alone when no id is excluded", async () => {
		db.organization.findFirst.mockResolvedValue(null);

		await organizationRepository.findConflictingSlug(db, { slug: "acme" });

		expect(db.organization.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({ where: { slug: "acme" } }),
		);
	});

	it("excludes the given id when checking the slug", async () => {
		db.organization.findFirst.mockResolvedValue(null);

		await organizationRepository.findConflictingSlug(db, {
			slug: "acme",
			excludeId: "org_1",
		});

		expect(db.organization.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { slug: "acme", NOT: { id: "org_1" } },
			}),
		);
	});
});

describe("organizationRepository.create", () => {
	it("generates an id and createdAt, and passes the given fields through", async () => {
		db.organization.create.mockResolvedValue({ id: "org_1" } as never);

		await organizationRepository.create(db, {
			name: "Acme",
			slug: "acme",
			microsoftTenantId: "tenant_1",
		});

		const call = db.organization.create.mock.calls[0]?.[0];
		expect(call?.data).toMatchObject({
			name: "Acme",
			slug: "acme",
			microsoftTenantId: "tenant_1",
		});
		expect(typeof call?.data.id).toBe("string");
		expect(call?.data.createdAt).toBeInstanceOf(Date);
	});
});

describe("organizationRepository.update", () => {
	it("updates by id with the given data", async () => {
		db.organization.update.mockResolvedValue({ id: "org_1" } as never);

		await organizationRepository.update(db, {
			id: "org_1",
			data: { name: "Renamed" },
		});

		expect(db.organization.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "org_1" },
				data: { name: "Renamed" },
			}),
		);
	});
});

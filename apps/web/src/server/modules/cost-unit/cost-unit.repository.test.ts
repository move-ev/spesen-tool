import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { costUnitRepository } from "./cost-unit.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("costUnitRepository.findById", () => {
	it("scopes the lookup by id and organizationId", async () => {
		db.costUnit.findFirst.mockResolvedValue(null);

		await costUnitRepository.findById(db, {
			id: "cu_1",
			organizationId: "org_1",
		});

		expect(db.costUnit.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "cu_1", organizationId: "org_1" },
			}),
		);
	});
});

describe("costUnitRepository.listPage / count", () => {
	it("listPage passes where/orderBy/skip/take through", async () => {
		db.costUnit.findMany.mockResolvedValue([]);

		const args = {
			where: { organizationId: "org_1" },
			orderBy: [{ tag: "asc" as const }],
			skip: 0,
			take: 10,
		};
		await costUnitRepository.listPage(db, args);

		expect(db.costUnit.findMany).toHaveBeenCalledWith(
			expect.objectContaining(args),
		);
	});

	it("count() counts using the given where clause", async () => {
		db.costUnit.count.mockResolvedValue(5);

		const result = await costUnitRepository.count(db, {
			organizationId: "org_1",
		});

		expect(result).toBe(5);
		expect(db.costUnit.count).toHaveBeenCalledWith({
			where: { organizationId: "org_1" },
		});
	});
});

describe("costUnitRepository.listGroupsWithOptions", () => {
	it("scopes by organizationId and excludes archived cost units from each group", async () => {
		db.costUnitGroup.findMany.mockResolvedValue([]);

		await costUnitRepository.listGroupsWithOptions(db, "org_1");

		expect(db.costUnitGroup.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { organizationId: "org_1" },
				select: expect.objectContaining({
					costUnits: expect.objectContaining({
						where: { status: { not: "ARCHIVED" } },
					}),
				}),
			}),
		);
	});
});

describe("costUnitRepository.listUngroupedOptions", () => {
	it("scopes by organizationId, excludes grouped and archived cost units", async () => {
		db.costUnit.findMany.mockResolvedValue([]);

		await costUnitRepository.listUngroupedOptions(db, "org_1");

		expect(db.costUnit.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					organizationId: "org_1",
					costUnitGroupId: null,
					status: { not: "ARCHIVED" },
				},
			}),
		);
	});
});

describe("costUnitRepository.listGroups", () => {
	it("scopes by organizationId", async () => {
		db.costUnitGroup.findMany.mockResolvedValue([]);

		await costUnitRepository.listGroups(db, "org_1");

		expect(db.costUnitGroup.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { organizationId: "org_1" } }),
		);
	});
});

describe("costUnitRepository.findGroupById", () => {
	it("scopes the lookup by id and organizationId", async () => {
		db.costUnitGroup.findFirst.mockResolvedValue(null);

		await costUnitRepository.findGroupById(db, {
			id: "group_1",
			organizationId: "org_1",
		});

		expect(db.costUnitGroup.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "group_1", organizationId: "org_1" },
			}),
		);
	});
});

describe("costUnitRepository.create / update / remove", () => {
	const writeData = {
		tag: "CU-1",
		title: "Marketing",
		examples: ["Flyers"],
		color: "RED" as const,
		costUnitGroupId: null,
	};

	it("create() stamps the organizationId onto the write data", async () => {
		db.costUnit.create.mockResolvedValue({ id: "cu_1" } as never);

		await costUnitRepository.create(db, {
			organizationId: "org_1",
			data: writeData,
		});

		expect(db.costUnit.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { ...writeData, organizationId: "org_1" },
			}),
		);
	});

	it("update() updates by id with the given data", async () => {
		db.costUnit.update.mockResolvedValue({ id: "cu_1" } as never);

		await costUnitRepository.update(db, {
			id: "cu_1",
			data: { ...writeData, status: "ACTIVE" },
		});

		expect(db.costUnit.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "cu_1" },
				data: { ...writeData, status: "ACTIVE" },
			}),
		);
	});

	it("remove() deletes by id", async () => {
		db.costUnit.delete.mockResolvedValue({ id: "cu_1" } as never);

		await costUnitRepository.remove(db, "cu_1");

		expect(db.costUnit.delete).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "cu_1" } }),
		);
	});
});

describe("costUnitRepository group mutations", () => {
	it("createGroup() stamps the organizationId", async () => {
		db.costUnitGroup.create.mockResolvedValue({ id: "group_1" } as never);

		await costUnitRepository.createGroup(db, {
			organizationId: "org_1",
			title: "Events",
		});

		expect(db.costUnitGroup.create).toHaveBeenCalledWith({
			data: { title: "Events", organizationId: "org_1" },
		});
	});

	it("updateGroup() updates by id", async () => {
		db.costUnitGroup.update.mockResolvedValue({ id: "group_1" } as never);

		await costUnitRepository.updateGroup(db, { id: "group_1", title: "Renamed" });

		expect(db.costUnitGroup.update).toHaveBeenCalledWith({
			where: { id: "group_1" },
			data: { title: "Renamed" },
		});
	});

	it("removeGroup() deletes by id", async () => {
		db.costUnitGroup.delete.mockResolvedValue({ id: "group_1" } as never);

		await costUnitRepository.removeGroup(db, "group_1");

		expect(db.costUnitGroup.delete).toHaveBeenCalledWith({
			where: { id: "group_1" },
		});
	});
});

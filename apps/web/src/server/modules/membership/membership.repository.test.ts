import { createMockDb, type MockPrismaClient } from "@zemio/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { membershipRepository } from "./membership.repository";

let db: MockPrismaClient;

beforeEach(() => {
	db = createMockDb();
});

describe("membershipRepository.findById", () => {
	it("scopes the lookup by id and organizationId", async () => {
		db.member.findFirst.mockResolvedValue(null);

		await membershipRepository.findById(db, {
			id: "member_1",
			organizationId: "org_1",
		});

		expect(db.member.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "member_1", organizationId: "org_1" },
			}),
		);
	});
});

describe("membershipRepository.listPage / count", () => {
	it("listPage passes where/skip/take through", async () => {
		db.member.findMany.mockResolvedValue([]);

		const args = { where: { organizationId: "org_1" }, skip: 0, take: 10 };
		await membershipRepository.listPage(db, args);

		expect(db.member.findMany).toHaveBeenCalledWith(
			expect.objectContaining(args),
		);
	});

	it("count() counts using the given where clause", async () => {
		db.member.count.mockResolvedValue(4);

		const result = await membershipRepository.count(db, {
			organizationId: "org_1",
		});

		expect(result).toBe(4);
		expect(db.member.count).toHaveBeenCalledWith({
			where: { organizationId: "org_1" },
		});
	});
});

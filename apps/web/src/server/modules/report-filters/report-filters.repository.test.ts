import { createMockDb } from "@zemio/test-utils";
import { describe, expect, it } from "vitest";
import { reportFiltersRepository } from "./report-filters.repository";

describe("reportFiltersRepository.findSources", () => {
	it("scopes both the cost-unit and owner lookups by organizationId", async () => {
		const db = createMockDb();
		db.$transaction.mockImplementation(
			(ops: unknown) => Promise.all(ops as Promise<unknown>[]) as never,
		);
		db.costUnit.findMany.mockResolvedValue([]);
		db.user.findMany.mockResolvedValue([]);

		await reportFiltersRepository.findSources(db, "org_1");

		expect(db.costUnit.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { organizationId: "org_1" } }),
		);
		expect(db.user.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { ownReports: { some: { organizationId: "org_1" } } },
			}),
		);
	});
});

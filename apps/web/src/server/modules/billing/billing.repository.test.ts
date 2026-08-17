import { createMockDb } from "@zemio/test-utils";
import { describe, expect, it } from "vitest";
import { billingRepository } from "./billing.repository";

describe("billingRepository.findOrganizationBilling", () => {
	it("reads the enforcement override and subscription for one organization", async () => {
		const db = createMockDb();
		db.organization.findUnique.mockResolvedValue(null as never);

		await billingRepository.findOrganizationBilling(db, "org_1");

		expect(db.organization.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "org_1" },
				select: expect.objectContaining({
					billingEnforced: true,
					subscription: expect.anything(),
				}),
			}),
		);
	});
});

describe("billingRepository.countSeats", () => {
	it("counts every member of the organization regardless of role", async () => {
		const db = createMockDb();
		db.member.count.mockResolvedValue(42 as never);

		const seats = await billingRepository.countSeats(db, "org_1");

		// No role filter: a seat is one member, whatever they can do (ADR-0005).
		expect(db.member.count).toHaveBeenCalledWith({
			where: { organizationId: "org_1" },
		});
		expect(seats).toBe(42);
	});
});

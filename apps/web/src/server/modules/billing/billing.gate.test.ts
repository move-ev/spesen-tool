import { describe, expect, it } from "vitest";
import { BILLING_GATED_PATHS, isBillingGatedPath } from "./billing.gate";

describe("isBillingGatedPath", () => {
	it.each([...BILLING_GATED_PATHS])("gates %s", (path) => {
		expect(isBillingGatedPath(path)).toBe(true);
	});

	it.each([
		"report.list",
		"report.byId",
		"report.update",
		"report.delete",
		"report.exportToPdf",
		"report.transition",
		"report.review",
		"expense.list",
		"expense.byId",
		"expense.update",
		"expense.delete",
	])("leaves %s alone", (path) => {
		expect(isBillingGatedPath(path)).toBe(false);
	});

	it("gates nothing by prefix, so a new sibling is not swept in", () => {
		expect(isBillingGatedPath("report.createTemplate")).toBe(false);
		expect(isBillingGatedPath("expense.createReceiptDraft")).toBe(false);
	});

	it("names the three operations the allowlist is meant to cover", () => {
		// Creating an expense is three procedures, so five paths cover three
		// operations. Pinned so widening the gate has to be deliberate.
		expect([...BILLING_GATED_PATHS].sort()).toEqual([
			"expense.createFood",
			"expense.createReceipt",
			"expense.createTravel",
			"report.create",
			"report.submit",
		]);
	});
});

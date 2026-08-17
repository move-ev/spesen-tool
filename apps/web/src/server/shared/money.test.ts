import { Prisma } from "@zemio/db";
import { describe, expect, it } from "vitest";
import { decimalToNumber, nullableDecimalToNumber } from "./money";

describe("decimalToNumber", () => {
	it("converts a Decimal to a number", () => {
		expect(decimalToNumber(new Prisma.Decimal("42.50"))).toBe(42.5);
	});
});

describe("nullableDecimalToNumber", () => {
	it("converts a present Decimal to a number", () => {
		expect(nullableDecimalToNumber(new Prisma.Decimal("42.50"))).toBe(42.5);
	});

	it("defaults null/undefined to 0", () => {
		expect(nullableDecimalToNumber(null)).toBe(0);
		expect(nullableDecimalToNumber(undefined)).toBe(0);
	});
});

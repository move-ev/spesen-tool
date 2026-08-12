import { describe, expect, it } from "vitest";
import { normalizeIban } from "./iban";

describe("normalizeIban", () => {
	it("strips internal whitespace", () => {
		expect(normalizeIban("DE89 3704 0044 0532 0130 00")).toBe(
			"DE89370400440532013000",
		);
	});

	it("strips leading/trailing whitespace", () => {
		expect(normalizeIban("  DE89370400440532013000  ")).toBe(
			"DE89370400440532013000",
		);
	});

	it("leaves an already-normalized IBAN unchanged", () => {
		expect(normalizeIban("DE89370400440532013000")).toBe(
			"DE89370400440532013000",
		);
	});
});

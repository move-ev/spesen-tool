import { describe, expect, it } from "vitest";
import { bankingPolicy } from "./banking.policy";

describe("bankingPolicy", () => {
	it.each([
		"read",
		"update",
		"delete",
	] as const)("%s: allows only the owner of the banking details, with no admin override", (action) => {
		expect(bankingPolicy.can(action, { userId: "u1" }, { userId: "u1" })).toBe(
			true,
		);
		expect(bankingPolicy.can(action, { userId: "u1" }, { userId: "u2" })).toBe(
			false,
		);
	});
});

import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { definePolicy } from "./policy";

type Ctx = { userId: string };
type Subject = { ownerId: string };

const policy = definePolicy<"read", Ctx, Subject>(
	{ read: (ctx, subject) => ctx.userId === subject.ownerId },
	"nope",
);

describe("definePolicy", () => {
	it("can() returns the rule's boolean result without throwing", () => {
		expect(policy.can("read", { userId: "u1" }, { ownerId: "u1" })).toBe(true);
		expect(policy.can("read", { userId: "u1" }, { ownerId: "u2" })).toBe(false);
	});

	it("authorize() does not throw when the rule allows the action", () => {
		expect(() =>
			policy.authorize("read", { userId: "u1" }, { ownerId: "u1" }),
		).not.toThrow();
	});

	it("authorize() throws a FORBIDDEN TRPCError with the configured message when denied", () => {
		expect(() =>
			policy.authorize("read", { userId: "u1" }, { ownerId: "u2" }),
		).toThrow(TRPCError);

		try {
			policy.authorize("read", { userId: "u1" }, { ownerId: "u2" });
			throw new Error("expected authorize to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(TRPCError);
			expect((error as TRPCError).code).toBe("FORBIDDEN");
			expect((error as TRPCError).message).toBe("nope");
		}
	});
});

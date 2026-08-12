import {
	asTRPCContext,
	createMockProtectedContext,
	expectTRPCErrorCode,
} from "@zemio/test-utils";
import { describe, expect, it } from "vitest";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { bankingProcedure } from "./banking.procedure";

const testRouter = createTRPCRouter({
	read: bankingProcedure("read").query(({ ctx }) => ({ id: ctx.details.id })),
});
const createCaller = createCallerFactory(testRouter);

function caller(ctx: ReturnType<typeof createMockProtectedContext>) {
	return createCaller(asTRPCContext(ctx));
}

describe("bankingProcedure", () => {
	it("throws NOT_FOUND when the banking details don't exist", async () => {
		const ctx = createMockProtectedContext();
		ctx.db.bankingDetails.findUnique.mockResolvedValue(null);

		await expectTRPCErrorCode(caller(ctx).read({ id: "bd_1" }), "NOT_FOUND");
	});

	it("throws FORBIDDEN when the details belong to a different user — there is no admin override", async () => {
		const ctx = createMockProtectedContext({ user: { id: "user_1" } });
		ctx.db.bankingDetails.findUnique.mockResolvedValue({
			id: "bd_1",
			userId: "user_2",
		} as never);

		await expectTRPCErrorCode(caller(ctx).read({ id: "bd_1" }), "FORBIDDEN");
	});

	it("succeeds and attaches ctx.details for the owner", async () => {
		const ctx = createMockProtectedContext({ user: { id: "user_1" } });
		ctx.db.bankingDetails.findUnique.mockResolvedValue({
			id: "bd_1",
			userId: "user_1",
		} as never);

		const result = await caller(ctx).read({ id: "bd_1" });

		expect(result).toEqual({ id: "bd_1" });
	});
});

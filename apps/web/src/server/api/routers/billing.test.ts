import {
	asTRPCContext,
	createMockOrgContext,
	createMockProtectedContext,
	expectTRPCErrorCode,
} from "@zemio/test-utils";
import { describe, expect, it } from "vitest";
import { billingRouter } from "@/server/api/routers/billing";
import { createCallerFactory } from "@/server/api/trpc";

const createCaller = createCallerFactory(billingRouter);

function caller(ctx: ReturnType<typeof createMockOrgContext>) {
	return createCaller(asTRPCContext(ctx));
}

describe("billing.status", () => {
	it("reports billing as disabled and the organization as entitled", async () => {
		const status = await caller(createMockOrgContext()).status();

		expect(status).toEqual({ enabled: false, entitled: true });
	});

	it("answers plain members, not only owners", async () => {
		const ctx = createMockOrgContext({ member: { role: "member" } });

		await expect(caller(ctx).status()).resolves.toEqual({
			enabled: false,
			entitled: true,
		});
	});

	it("reads no organization state while billing is disabled", async () => {
		const ctx = createMockOrgContext();

		await caller(ctx).status();

		expect(ctx.db.organization.findUnique).not.toHaveBeenCalled();
		expect(ctx.db.member.count).not.toHaveBeenCalled();
	});

	it("requires an active organization", async () => {
		const ctx = createMockProtectedContext();

		await expectTRPCErrorCode(caller(ctx).status(), "FORBIDDEN");
	});
});

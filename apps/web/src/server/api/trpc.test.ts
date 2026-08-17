import {
	asTRPCContext,
	createMockContext,
	createMockOrgAdminContext,
	createMockOrgContext,
	createMockPlatformAdminContext,
	createMockProtectedContext,
	expectTRPCErrorCode,
} from "@zemio/test-utils";
import { describe, expect, it } from "vitest";
import {
	createCallerFactory,
	createTRPCRouter,
	orgAdminProcedure,
	orgProcedure,
	platformAdminProcedure,
	protectedProcedure,
	publicProcedure,
} from "./trpc";

const testRouter = createTRPCRouter({
	publicPing: publicProcedure.query(() => "public-ok"),
	protectedPing: protectedProcedure.query(() => "protected-ok"),
	orgPing: orgProcedure.query(({ ctx }) => ({
		organizationId: ctx.organizationId,
		orgRole: ctx.orgRole,
	})),
	orgAdminPing: orgAdminProcedure.query(() => "org-admin-ok"),
	platformAdminPing: platformAdminProcedure.query(() => "platform-admin-ok"),
});

const createCaller = createCallerFactory(testRouter);

function caller(ctx: ReturnType<typeof createMockContext>) {
	return createCaller(asTRPCContext(ctx));
}

describe("publicProcedure", () => {
	it("succeeds with no session", async () => {
		const result = await caller(createMockContext()).publicPing();

		expect(result).toBe("public-ok");
	});
});

describe("protectedProcedure", () => {
	it("throws UNAUTHORIZED with no session", async () => {
		await expectTRPCErrorCode(
			caller(createMockContext()).protectedPing(),
			"UNAUTHORIZED",
		);
	});

	it("succeeds with a logged-in session", async () => {
		const result = await caller(createMockProtectedContext()).protectedPing();

		expect(result).toBe("protected-ok");
	});
});

describe("orgProcedure", () => {
	it("throws FORBIDDEN when no organization is active", async () => {
		await expectTRPCErrorCode(
			caller(createMockProtectedContext({ activeOrganizationId: null })).orgPing(),
			"FORBIDDEN",
		);
	});

	it("throws FORBIDDEN when the caller has no membership in the active organization", async () => {
		// activeOrganizationId set, but db.member.findFirst is left unmocked
		// (resolves to undefined) — simulates a member row that doesn't exist.
		await expectTRPCErrorCode(
			caller(
				createMockProtectedContext({ activeOrganizationId: "org_1" }),
			).orgPing(),
			"FORBIDDEN",
		);
	});

	it("resolves organizationId/orgRole from the member lookup when it succeeds", async () => {
		const result = await caller(
			createMockOrgContext({
				organizationId: "org_1",
				member: { role: "member" },
			}),
		).orgPing();

		expect(result).toEqual({ organizationId: "org_1", orgRole: "member" });
	});
});

describe("orgAdminProcedure", () => {
	it("throws UNAUTHORIZED for a non-admin org member", async () => {
		await expectTRPCErrorCode(
			caller(createMockOrgContext({ member: { role: "member" } })).orgAdminPing(),
			"UNAUTHORIZED",
		);
	});

	it("succeeds for an admin org member", async () => {
		const result = await caller(createMockOrgAdminContext()).orgAdminPing();

		expect(result).toBe("org-admin-ok");
	});

	it("succeeds for an owner org member", async () => {
		const result = await caller(
			createMockOrgContext({ member: { role: "owner" } }),
		).orgAdminPing();

		expect(result).toBe("org-admin-ok");
	});
});

describe("platformAdminProcedure", () => {
	it("throws FORBIDDEN for a non-platform-admin user", async () => {
		await expectTRPCErrorCode(
			caller(
				createMockProtectedContext({ user: { role: "user" } }),
			).platformAdminPing(),
			"FORBIDDEN",
		);
	});

	it("succeeds for a platform admin (session.user.role === 'admin')", async () => {
		const result = await caller(
			createMockPlatformAdminContext(),
		).platformAdminPing();

		expect(result).toBe("platform-admin-ok");
	});
});

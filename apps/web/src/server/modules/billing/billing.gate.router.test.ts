import { TRPCError } from "@trpc/server";
import { asTRPCContext, createMockOrgContext } from "@zemio/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Billing gates nothing while it is switched off, which is how the rest of the
// suite runs. Turning it on means replacing the config module for this file.
vi.mock("@/server/modules/billing/billing.config", async (importOriginal) => ({
	...(await importOriginal<object>()),
	billingConfig: {
		enabled: true,
		secretKey: "sk_test_1",
		webhookSecret: "whsec_1",
	},
}));

const { BILLING_GATED_PATHS, BILLING_NOT_ENTITLED, isBillingGatedPath } =
	await import("./billing.gate");
const { appRouter } = await import("@/server/api/root");
const { createCallerFactory } = await import("@/server/api/trpc");

const createCaller = createCallerFactory(appRouter);

type Subscription = { tier: string; seatLimit: number; status: string } | null;

function context(args: {
	subscription?: Subscription;
	billingEnforced?: boolean;
	seats?: number;
	role?: string;
}) {
	const ctx = createMockOrgContext({
		organizationId: "org_1",
		member: { role: args.role ?? "member" },
	});
	ctx.db.organization.findUnique.mockResolvedValue({
		billingEnforced: args.billingEnforced ?? true,
		subscription: args.subscription ?? null,
	} as never);
	ctx.db.member.count.mockResolvedValue((args.seats ?? 1) as never);
	return ctx;
}

function caller(args: Parameters<typeof context>[0]) {
	return createCaller(asTRPCContext(context(args)));
}

/**
 * Whether a call was refused *for billing reasons*.
 *
 * An ungated operation reaches its resolver, which may then fail for want of a
 * mock — that is not the question here, so anything other than the billing
 * refusal counts as "not gated".
 */
async function refusedForBilling(call: Promise<unknown>): Promise<boolean> {
	try {
		await call;
		return false;
	} catch (error) {
		return error instanceof TRPCError && error.message === BILLING_NOT_ENTITLED;
	}
}

const lapsed = { tier: "M", seatLimit: 25, status: "canceled" };

function lapsedContext(args: { role?: string } = {}) {
	return context({ subscription: lapsed, role: args.role });
}

const pastDue = { tier: "M", seatLimit: 25, status: "past_due" };
const active = { tier: "M", seatLimit: 25, status: "active" };

/** One call per gated path, with input valid enough to reach the gate. */
function gatedCalls(c: ReturnType<typeof createCaller>) {
	return {
		"report.create": () =>
			c.report.create({
				title: "A trip",
				description: "",
				costUnitId: "cost_unit_1",
				bankingDetailsId: "banking_1",
			}),
		"report.submit": () => c.report.submit({ id: "report_1" }),
		"expense.createReceipt": () =>
			c.expense.createReceipt({
				reportId: "report_1",
				title: "Coffee",
				amount: 350,
				date: new Date(),
				attachmentIds: [],
			} as never),
		"expense.createTravel": () =>
			c.expense.createTravel({
				reportId: "report_1",
				title: "Train",
				date: new Date(),
			} as never),
		"expense.createFood": () =>
			c.expense.createFood({
				reportId: "report_1",
				title: "Lunch",
				date: new Date(),
			} as never),
	};
}

/** Every procedure path the API actually exposes, read off the built router. */
const ALL_PATHS = Object.keys(
	(appRouter as unknown as { _def: { procedures: Record<string, unknown> } })
		._def.procedures,
);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("the gate covers exactly the paths it claims to", () => {
	it("has a call for every gated path, so none goes untested", () => {
		expect(Object.keys(gatedCalls(caller({}))).sort()).toEqual(
			[...BILLING_GATED_PATHS].sort(),
		);
	});

	it("gates only paths that exist, so a rename cannot quietly disarm it", () => {
		expect(ALL_PATHS.length).toBeGreaterThan(0);
		expect(
			[...BILLING_GATED_PATHS].filter((path) => !ALL_PATHS.includes(path)),
		).toEqual([]);
	});

	it("leaves every other procedure in the API ungated", () => {
		// Derived from the built router rather than hand-listed: a procedure
		// added later appears here automatically, and one cannot be gated by
		// accident without this failing.
		expect(ALL_PATHS.filter(isBillingGatedPath).sort()).toEqual(
			[...BILLING_GATED_PATHS].sort(),
		);
	});
});

describe("a lapsed organization", () => {
	it.each(
		Object.entries(gatedCalls(caller({ subscription: lapsed }))),
	)("is refused %s", async (_path, call) => {
		expect(await refusedForBilling(call())).toBe(true);
	});

	it.each([
		[
			"reads its reports",
			(c: ReturnType<typeof createCaller>) =>
				c.report.list({ page: 1, pageSize: 20 }),
		],
		[
			"reads a report",
			(c: ReturnType<typeof createCaller>) => c.report.byId({ id: "report_1" }),
		],
		[
			"reads its expenses",
			(c: ReturnType<typeof createCaller>) =>
				c.expense.list({ reportId: "report_1" }),
		],
		[
			"exports a PDF",
			(c: ReturnType<typeof createCaller>) =>
				c.report.exportToPdf({ id: "report_1" }),
		],
		[
			"edits an existing draft",
			(c: ReturnType<typeof createCaller>) =>
				c.report.update({ id: "report_1", title: "Edited" } as never),
		],
		[
			"edits an existing expense",
			(c: ReturnType<typeof createCaller>) =>
				c.expense.update({ id: "expense_1", title: "Edited" } as never),
		],
		[
			"deletes a draft",
			(c: ReturnType<typeof createCaller>) => c.report.delete({ id: "report_1" }),
		],
		[
			"reads its settings",
			(c: ReturnType<typeof createCaller>) => c.settings.get(),
		],
		[
			"reads its members",
			(c: ReturnType<typeof createCaller>) =>
				c.membership.list({ page: 1, pageSize: 20 }),
		],
		[
			"reads its billing status",
			(c: ReturnType<typeof createCaller>) => c.billing.status(),
		],
	])("still %s", async (_name, call) => {
		const ctx = lapsedContext();

		expect(await refusedForBilling(call(createCaller(asTRPCContext(ctx))))).toBe(
			false,
		);
	});

	it.each([
		[
			"advances a report through review",
			(c: ReturnType<typeof createCaller>) =>
				c.report.transition({ id: "report_1", status: "ACCEPTED" } as never),
		],
		[
			"opens a report for review",
			(c: ReturnType<typeof createCaller>) => c.report.review({ id: "report_1" }),
		],
	])("still lets an administrator %s", async (_name, call) => {
		const ctx = lapsedContext({ role: "admin" });

		expect(await refusedForBilling(call(createCaller(asTRPCContext(ctx))))).toBe(
			false,
		);
		// The stronger half: not merely unrefused, but never asked about — the
		// gate returned before any billing state was read.
		expect(ctx.db.organization.findUnique).not.toHaveBeenCalled();
	});
});

describe("organizations that are not lapsed", () => {
	it.each(
		Object.entries(gatedCalls(caller({ subscription: pastDue }))),
	)("a past-due organization may still %s", async (_path, call) => {
		expect(await refusedForBilling(call())).toBe(false);
	});

	it("an over-seat-limit organization may still create a report", async () => {
		const c = caller({ subscription: { ...active, seatLimit: 2 }, seats: 400 });

		expect(await refusedForBilling(gatedCalls(c)["report.create"]())).toBe(false);
	});

	it("an organization not opted into enforcement may still create a report", async () => {
		const c = caller({ subscription: null, billingEnforced: false });

		expect(await refusedForBilling(gatedCalls(c)["report.create"]())).toBe(false);
	});

	it("reads no billing state at all for an ungated path", async () => {
		const ctx = createMockOrgContext({ organizationId: "org_1" });
		ctx.db.organization.findUnique.mockResolvedValue({
			billingEnforced: true,
			subscription: lapsed,
		} as never);
		ctx.db.member.count.mockResolvedValue(1 as never);

		await createCaller(asTRPCContext(ctx))
			.report.list({ page: 1, pageSize: 20 })
			.catch(() => {});

		expect(ctx.db.organization.findUnique).not.toHaveBeenCalled();
	});
});

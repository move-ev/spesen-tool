import "server-only";
import { TRPCError } from "@trpc/server";
import {
	type BillingRequestContext,
	toBillingServiceContext,
} from "./billing.procedure";
import { isOrganizationEntitled } from "./billing.service";

/**
 * The operations an unentitled organization may not perform.
 *
 * An allowlist, never a broad gate with exemptions: under the opposite
 * arrangement an operation added later would silently become billing-locked
 * without anyone deciding it should be, and would surface as an organization
 * unable to do something unrelated to billing with no clue why (ADR-0006).
 *
 * Three operations — start a report, add an expense, submit a report — and
 * five paths, because adding an expense is three procedures. Everything else
 * keeps working while a subscription is lapsed: the data in Zemio is the
 * organization's own financial record, and it is needed most during exactly
 * the period a payment has failed.
 *
 * `report.transition` is deliberately absent, because an administrator's
 * status changes must keep working for work already submitted. One transition
 * — moving an editable report to PENDING_APPROVAL — is a submission by
 * another name, so an administrator can still submit for an owner while the
 * subscription is lapsed. Closing that would mean gating on the input rather
 * than the operation, and would also block genuine review.
 *
 * Adding to this list is a deliberate act. So is renaming any procedure named
 * here — the paths are matched exactly, and billing.gate.router.test.ts fails
 * if one of them stops resolving to a real procedure.
 */
export const BILLING_GATED_PATHS: ReadonlySet<string> = new Set([
	"report.create",
	"report.submit",
	"expense.createReceipt",
	"expense.createTravel",
	"expense.createFood",
]);

export function isBillingGatedPath(path: string): boolean {
	return BILLING_GATED_PATHS.has(path);
}

/**
 * The message carried by a refusal that is about billing.
 *
 * Exported so the interface can recognise this case and explain it — a member
 * who did not cause the lapse and cannot resolve it should be told who can,
 * not shown a bare permission error. `FORBIDDEN` is what tRPC gives us; this
 * is what distinguishes it from every other `FORBIDDEN` the API raises.
 */
export const BILLING_NOT_ENTITLED = "BILLING_NOT_ENTITLED";

export type EntitlementContext = BillingRequestContext & {
	organizationId: string;
};

/**
 * Refuses a gated operation for an organization that is not entitled.
 *
 * Anything not on the allowlist returns before a billing query runs, so the
 * gate costs an ungated request nothing. With billing off, or enforcement off
 * for this organization, entitlement resolves true and nothing is refused
 * (ADR-0001).
 */
export async function assertEntitled(
	ctx: EntitlementContext,
	path: string,
): Promise<void> {
	if (!isBillingGatedPath(path)) return;

	const entitled = await isOrganizationEntitled(
		toBillingServiceContext(ctx),
		ctx.organizationId,
	);

	if (!entitled) {
		throw new TRPCError({ code: "FORBIDDEN", message: BILLING_NOT_ENTITLED });
	}
}

import "server-only";
import type { PrismaClient } from "@zemio/db";
import type { BillingConfig } from "./billing.config";
import {
	type EntitlementState,
	isEntitled,
	isOverSeatLimit,
	resolveEntitlement,
} from "./billing.policy";
import { billingRepository } from "./billing.repository";

export type BillingServiceContext = {
	db: PrismaClient;
	config: BillingConfig;
};

/**
 * Everything the interface is allowed to know about an organization's billing,
 * and the only shape it reads — so the banner and the billing page cannot
 * disagree about what state an organization is in.
 *
 * A union on `enabled` rather than a wide object full of nulls: with billing
 * off there is no tier, no limit and no seat count worth reporting, and the
 * interface is forced to establish that billing exists before rendering
 * anything about it. Nothing here describes how billing is configured.
 */
export type BillingStatus =
	| { enabled: false; entitled: true }
	| {
			enabled: true;
			entitled: boolean;
			state: EntitlementState;
			tier: string | null;
			seatLimit: number | null;
			seatCount: number;
			overSeatLimit: boolean;
	  };

/**
 * Resolves an organization's billing status.
 *
 * With billing switched off this short-circuits before touching the database:
 * a self-hosted instance runs no billing queries at all, and every organization
 * is entitled unconditionally (ADR-0001).
 */
export async function getBillingStatus(
	ctx: BillingServiceContext,
	organizationId: string,
): Promise<BillingStatus> {
	if (!ctx.config.enabled) {
		return { enabled: false, entitled: true };
	}

	const [organization, seatCount] = await Promise.all([
		billingRepository.findOrganizationBilling(ctx.db, organizationId),
		billingRepository.countSeats(ctx.db, organizationId),
	]);

	// A caller with a resolved membership whose organization has since vanished
	// is a race, not a state to serve — treat it as the enforced default rather
	// than inventing an entitled one.
	const subscription = organization?.subscription ?? null;
	const state = resolveEntitlement({
		billingEnabled: true,
		enforcedForOrganization: organization?.billingEnforced ?? true,
		subscription,
	});

	return {
		enabled: true,
		entitled: isEntitled(state),
		state,
		tier: subscription?.tier ?? null,
		seatLimit: subscription?.seatLimit ?? null,
		seatCount,
		overSeatLimit: isOverSeatLimit(seatCount, subscription?.seatLimit ?? null),
	};
}

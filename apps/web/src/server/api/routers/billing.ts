import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { billingConfig, getBillingStatus } from "@/server/modules/billing";

export const billingRouter = createTRPCRouter({
	/**
	 * The single source the banner and the billing page both read. Available to
	 * every member, not just owners: a member needs to know their organization
	 * is read-only even though they cannot do anything about it.
	 */
	status: orgProcedure.query(() => getBillingStatus(billingConfig)),
});

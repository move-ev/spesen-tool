import type { PrismaClient } from "@zemio/db";
import { billingConfig } from "./billing.config";
import type { BillingServiceContext } from "./billing.service";

type BillingRequestContext = {
	db: PrismaClient;
};

/**
 * The billing configuration is supplied here rather than living on the tRPC
 * context, so the shared context and the test utilities stay free of billing.
 */
export function toBillingServiceContext(
	ctx: BillingRequestContext,
): BillingServiceContext {
	return { db: ctx.db, config: billingConfig };
}

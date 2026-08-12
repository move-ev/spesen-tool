import "server-only";
import type { BillingConfig } from "./billing.config";

/**
 * Everything the interface is allowed to know about an organization's billing.
 *
 * Deliberately the only shape either the banner or the billing page reads, so
 * the two can never disagree about what state an organization is in. It carries
 * no configuration — the browser learns whether billing exists, never how it is
 * set up.
 */
export type BillingStatus = {
	enabled: boolean;
	entitled: boolean;
};

/**
 * Resolves an organization's billing status.
 *
 * With billing switched off every organization is entitled unconditionally
 * (ADR-0001). Switched on, entitlement is still unconditional here because
 * there is nothing yet to derive it from — subscription state and the rules
 * that read it arrive with DEV-27, which replaces this branch.
 */
export function getBillingStatus(config: BillingConfig): BillingStatus {
	return { enabled: config.enabled, entitled: true };
}

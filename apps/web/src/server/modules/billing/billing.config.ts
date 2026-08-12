import "server-only";
import { env } from "@/env";

/**
 * Whether this deployment bills at all, and — when it does — the billing
 * provider credentials it bills with.
 *
 * A discriminated union rather than three loose optionals: everything later in
 * the feature that needs a credential can only reach it through the `enabled`
 * branch, so no downstream code has to re-check that a key it was handed is
 * actually present.
 */
export type BillingConfig =
	| { enabled: false }
	| { enabled: true; secretKey: string; webhookSecret: string };

/** The raw environment slice billing reads. Values arrive as strings. */
export type BillingEnvSource = {
	BILLING_ENABLED?: string;
	STRIPE_SECRET_KEY?: string;
	STRIPE_WEBHOOK_SECRET?: string;
};

/**
 * Reads the deployment-wide billing flag off a string environment variable.
 *
 * Only an explicit `true`/`1` switches billing on. Anything else — including a
 * typo, an unset variable, or a value this doesn't recognise — leaves it off,
 * because off is the state a self-hoster expects to be in without asking
 * (ADR-0001).
 */
export function parseBillingEnabled(value: string | undefined): boolean {
	const normalized = value?.trim().toLowerCase();
	return normalized === "true" || normalized === "1";
}

/** Blank and whitespace-only credentials are as absent as an unset variable. */
function present(value: string | undefined): value is string {
	return value !== undefined && value.trim() !== "";
}

/**
 * Resolves the billing configuration, failing when a deployment claims to bill
 * but cannot.
 *
 * The check is deliberately at resolve time rather than at the first checkout:
 * an operator who turns billing on without credentials should find out while
 * deploying, not when a customer's payment fails.
 */
export function resolveBillingConfig(source: BillingEnvSource): BillingConfig {
	if (!parseBillingEnabled(source.BILLING_ENABLED)) {
		return { enabled: false };
	}

	const { STRIPE_SECRET_KEY: secretKey, STRIPE_WEBHOOK_SECRET: webhookSecret } =
		source;

	if (!present(secretKey) || !present(webhookSecret)) {
		// Every missing name at once — an operator fixing this one restart at a
		// time learns about the second variable only after redeploying for the first.
		const missing = [
			...(present(secretKey) ? [] : ["STRIPE_SECRET_KEY"]),
			...(present(webhookSecret) ? [] : ["STRIPE_WEBHOOK_SECRET"]),
		];
		throw new Error(
			`BILLING_ENABLED is on, but the billing provider credentials it requires are missing: ${missing.join(
				", ",
			)}. Set them, or unset BILLING_ENABLED to run without billing.`,
		);
	}

	return { enabled: true, secretKey, webhookSecret };
}

/**
 * Resolved once at module load.
 *
 * `src/instrumentation.ts` imports this module during server startup so a
 * deployment that claims to bill but lacks credentials dies while booting,
 * rather than starting healthy and failing on the first request that happens
 * to reach the tRPC API. Reaching it lazily through the router would still
 * throw, just later and to a customer instead of to the deploy log.
 */
export const billingConfig: BillingConfig = resolveBillingConfig(env);

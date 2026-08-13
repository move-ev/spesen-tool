process.env.SKIP_ENV_VALIDATION = "1";

// Router tests go through the real tRPC procedure chain, including the dev-only
// artificial latency middleware — skip it so the suite stays fast.
process.env.DISABLE_DEV_DELAY = "true";

// Deterministic 32-byte key so lib/banking/cryptic.ts's encrypt/decrypt round
// trips can be tested without a real secret.
process.env.SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

// Billing resolves its configuration once at module load, so a machine or CI
// runner that happens to export BILLING_ENABLED would change what the suite is
// testing — or fail collection outright when no Stripe credentials are set.
// Pin it off; tests that need billing on inject the config themselves.
process.env.BILLING_ENABLED = "false";
delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_WEBHOOK_SECRET;

// Required in production, so nothing that reads it guards against absence. The
// suite skips env validation, so it has to be supplied here instead.
process.env.BETTER_AUTH_URL = "https://zemio.test";

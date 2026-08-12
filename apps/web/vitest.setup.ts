process.env.SKIP_ENV_VALIDATION = "1";

// Router tests go through the real tRPC procedure chain, including the dev-only
// artificial latency middleware — skip it so the suite stays fast.
process.env.DISABLE_DEV_DELAY = "true";

// Deterministic 32-byte key so lib/banking/cryptic.ts's encrypt/decrypt round
// trips can be tested without a real secret.
process.env.SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

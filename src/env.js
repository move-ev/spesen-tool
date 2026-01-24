import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Environment Variables (Secrets Only)
 *
 * This file validates environment variables that contain sensitive values (secrets).
 * Non-sensitive configuration should be placed in config.ts at the project root.
 *
 * For self-hosting documentation, see SELF_HOSTING.md
 */
export const env = createEnv({
	/**
	 * Server-side environment variables schema
	 *
	 * These are secrets that should NEVER be committed to version control.
	 * They are validated at build time to ensure the app isn't built with missing secrets.
	 */
	server: {
		// =================================================================
		// Authentication Secrets
		// =================================================================

		/**
		 * Secret key for signing authentication tokens (JWT)
		 * Generate with: openssl rand -base64 32
		 * Required in production, optional in development
		 */
		BETTER_AUTH_SECRET:
			process.env.NODE_ENV === "production" ? z.string() : z.string().optional(),

		/**
		 * Microsoft OAuth client secret
		 * Get this from Azure AD App Registration > Certificates & secrets
		 */
		MICROSOFT_CLIENT_SECRET: z.string(),

		// =================================================================
		// Storage Secrets (S3-compatible)
		// =================================================================

		/**
		 * S3-compatible storage access key ID
		 */
		STORAGE_ACCESS_KEY_ID: z.string(),

		/**
		 * S3-compatible storage secret access key
		 */
		STORAGE_ACCESS_KEY: z.string(),

		// =================================================================
		// Email Service Secret
		// =================================================================

		/**
		 * Resend API key for sending emails
		 * Get this from https://resend.com/api-keys
		 */
		RESEND_API_KEY: z.string(),

		// =================================================================
		// Runtime Environment
		// =================================================================

		/**
		 * Node.js environment
		 */
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),

		// =================================================================
		// Optional Overrides (for CI/CD and backward compatibility)
		// =================================================================

		/**
		 * Database URL override
		 * When set, takes precedence over config.ts database.url
		 * Useful for CI/CD pipelines and Docker deployments
		 */
		DATABASE_URL: z.string().url().optional(),

		/**
		 * Better Auth URL override
		 * When set, takes precedence over config.ts auth.url
		 */
		BETTER_AUTH_URL: z.string().url().optional(),

		/**
		 * Superuser ID override
		 * When set, takes precedence over config.ts app.superuserId
		 */
		SUPERUSER_ID: z.string().optional(),

		/**
		 * Microsoft tenant ID override
		 * When set, takes precedence over config.ts auth.microsoft.tenantId
		 */
		MICROSOFT_TENANT_ID: z.string().optional(),

		/**
		 * Microsoft client ID override
		 * When set, takes precedence over config.ts auth.microsoft.clientId
		 */
		MICROSOFT_CLIENT_ID: z.string().optional(),

		/**
		 * Storage host override
		 * When set, takes precedence over config.ts storage.host
		 */
		STORAGE_HOST: z.string().optional(),

		/**
		 * Storage region override
		 * When set, takes precedence over config.ts storage.region
		 */
		STORAGE_REGION: z.string().optional(),

		/**
		 * Storage bucket override
		 * When set, takes precedence over config.ts storage.bucket
		 */
		STORAGE_BUCKET: z.string().optional(),

		/**
		 * Email from address override
		 * When set, takes precedence over config.ts email.from
		 */
		EMAIL_FROM: z.string().email().optional(),

		/**
		 * Secret key for signing banking details
		 * Generate with: openssl rand -base64 32
		 */
		SECRET_ENCRYPTION_KEY: z.string(),
	},

	/**
	 * Client-side environment variables schema
	 *
	 * Variables exposed to the client must be prefixed with NEXT_PUBLIC_
	 * WARNING: Never expose secrets to the client!
	 */
	client: {
		// Currently no client-side env vars needed
		// NEXT_PUBLIC_EXAMPLE: z.string(),
	},

	/**
	 * Runtime environment variable mapping
	 *
	 * Required for Next.js edge runtimes and client-side code
	 */
	runtimeEnv: {
		// Secrets (required)
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
		STORAGE_ACCESS_KEY_ID: process.env.STORAGE_ACCESS_KEY_ID,
		STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		SECRET_ENCRYPTION_KEY: process.env.SECRET_ENCRYPTION_KEY,

		// Runtime
		NODE_ENV: process.env.NODE_ENV,

		// Optional overrides
		DATABASE_URL: process.env.DATABASE_URL,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		SUPERUSER_ID: process.env.SUPERUSER_ID,
		MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID,
		MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
		STORAGE_HOST: process.env.STORAGE_HOST,
		STORAGE_REGION: process.env.STORAGE_REGION,
		STORAGE_BUCKET: process.env.STORAGE_BUCKET,
		EMAIL_FROM: process.env.EMAIL_FROM,
	},

	/**
	 * Skip validation during Docker builds
	 *
	 * Set SKIP_ENV_VALIDATION=1 to skip validation during build time.
	 * This is useful for Docker builds where secrets aren't available.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,

	/**
	 * Treat empty strings as undefined
	 *
	 * This ensures that SOME_VAR="" is treated as if SOME_VAR wasn't set.
	 */
	emptyStringAsUndefined: true,
});

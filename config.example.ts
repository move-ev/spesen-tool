/**
 * Spesen Tool Configuration
 *
 * This file configures the Spesen Tool application for self-hosted deployments.
 * Copy this file to `config.ts` and fill in your values.
 *
 * IMPORTANT:
 * - Never commit config.ts to version control (it's in .gitignore)
 * - Secrets (API keys, passwords) should be set via environment variables
 * - See SELF_HOSTING.md for detailed setup instructions
 */

import type { ConfigInput } from "./src/lib/config";

const config: ConfigInput = {
	// ===========================================================================
	// Application Settings
	// ===========================================================================
	app: {
		/**
		 * Application name displayed in the UI and emails
		 * @default "Spesen Tool"
		 */
		name: "Spesen Tool",

		/**
		 * Public URL where the application is accessible
		 * Used for generating links in emails and OAuth callbacks
		 * @example "https://expenses.example.com"
		 */
		url: "https://expenses.example.com",

		/**
		 * User ID of the superuser who has full admin privileges
		 * This user can promote/demote other admins and cannot be demoted
		 * Get this ID from the database after the first admin signs in
		 */
		superuserId: "your-superuser-id-here",
	},

	// ===========================================================================
	// Database Settings
	// ===========================================================================
	database: {
		/**
		 * PostgreSQL connection URL
		 * Format: postgresql://user:password@host:port/database
		 *
		 * Can be overridden by DATABASE_URL environment variable
		 * @example "postgresql://postgres:password@localhost:5432/spesen_tool"
		 */
		url: "postgresql://user:password@localhost:5432/spesen_tool",

		/**
		 * Database query logging levels (optional)
		 * @default ["error"] in production, ["query", "error", "warn"] in development
		 * @example ["query", "error", "warn", "info"]
		 */
		// logging: ["error"],
	},

	// ===========================================================================
	// Authentication Settings
	// ===========================================================================
	auth: {
		/**
		 * Base URL for authentication (usually same as app.url)
		 * Used for OAuth callback URLs
		 *
		 * Can be overridden by BETTER_AUTH_URL environment variable
		 */
		url: "https://expenses.example.com",

		/**
		 * Microsoft Azure AD / Entra ID OAuth configuration
		 * Register your app at: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
		 */
		microsoft: {
			/**
			 * Azure AD tenant ID
			 * Found in: Azure Portal > Azure Active Directory > Overview
			 *
			 * Can be overridden by MICROSOFT_TENANT_ID environment variable
			 */
			tenantId: "your-tenant-id",

			/**
			 * Application (client) ID
			 * Found in: Azure Portal > App Registration > Overview
			 *
			 * Can be overridden by MICROSOFT_CLIENT_ID environment variable
			 */
			clientId: "your-client-id",

			// NOTE: Client secret must be set via MICROSOFT_CLIENT_SECRET env var
		},
	},

	// ===========================================================================
	// Storage Settings (S3-compatible)
	// ===========================================================================
	storage: {
		/**
		 * S3-compatible storage host
		 * @example "s3.amazonaws.com" for AWS S3
		 * @example "minio.example.com" for self-hosted MinIO
		 * @example "storage.googleapis.com" for Google Cloud Storage
		 *
		 * Can be overridden by STORAGE_HOST environment variable
		 */
		host: "s3.amazonaws.com",

		/**
		 * Storage region
		 * @example "eu-central-1" for AWS Frankfurt
		 * @example "us-east-1" for AWS N. Virginia
		 *
		 * Can be overridden by STORAGE_REGION environment variable
		 */
		region: "eu-central-1",

		/**
		 * S3 bucket name for storing file attachments
		 *
		 * Can be overridden by STORAGE_BUCKET environment variable
		 */
		bucket: "my-spesen-tool-bucket",

		/**
		 * Use HTTPS for storage connections
		 * @default true
		 */
		secure: true,

		/**
		 * Force path-style URLs instead of virtual-hosted-style
		 * Required for some S3-compatible services like MinIO
		 * @default false
		 */
		forcePathStyle: false,

		// NOTE: Access credentials must be set via environment variables:
		// - STORAGE_ACCESS_KEY_ID
		// - STORAGE_ACCESS_KEY
	},

	// ===========================================================================
	// Upload Settings
	// ===========================================================================
	upload: {
		/**
		 * Maximum file size in bytes
		 * @default 5242880 (5MB)
		 * @example 10 * 1024 * 1024 for 10MB
		 */
		maxFileSize: 5 * 1024 * 1024,

		/**
		 * Maximum number of files per upload
		 * @default 5
		 */
		maxFiles: 5,
	},

	// ===========================================================================
	// Email Settings
	// ===========================================================================
	email: {
		/**
		 * Email address used as the sender (From field)
		 * Must be verified in your Resend account
		 *
		 * Can be overridden by EMAIL_FROM environment variable
		 * @example "expenses@example.com"
		 */
		from: "expenses@example.com",

		/**
		 * Reply-to email address (optional)
		 * @example "support@example.com"
		 */
		replyTo: "support@example.com",

		// NOTE: API key must be set via RESEND_API_KEY environment variable
		provider: "resend",
	},
};

export default config;

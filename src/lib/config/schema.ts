import { z } from "zod";

/**
 * Application configuration schema
 *
 * This schema defines all non-sensitive configuration options for the Spesen Tool.
 * Secrets (API keys, passwords) should be provided via environment variables.
 */

// =============================================================================
// App Configuration
// =============================================================================

export const appConfigSchema = z.object({
	/** Application name displayed in UI and emails */
	name: z.string().default("Spesen Tool"),
	/** Public-facing URL of the application (without trailing slash) */
	url: z.string().url(),
	/** User ID of the superuser who has admin privileges */
	superuserId: z.string().min(1, "Superuser ID is required"),
});

// =============================================================================
// Database Configuration
// =============================================================================

export const databaseConfigSchema = z.object({
	/** PostgreSQL connection URL */
	url: z.string().url(),
	/**
	 * Prisma logging levels
	 * @default ["error"] in production, ["query", "error", "warn"] in development
	 */
	logging: z.array(z.enum(["query", "error", "warn", "info"])).optional(),
});

// =============================================================================
// Authentication Configuration
// =============================================================================

export const microsoftAuthConfigSchema = z.object({
	/** Microsoft Azure AD tenant ID */
	tenantId: z.string().min(1, "Microsoft tenant ID is required"),
	/** Microsoft OAuth application (client) ID */
	clientId: z.string().min(1, "Microsoft client ID is required"),
	// Note: clientSecret is provided via MICROSOFT_CLIENT_SECRET env var
});

export const authConfigSchema = z.object({
	/**
	 * Base URL for authentication callbacks
	 * Usually the same as app.url
	 */
	url: z.string().url(),
	/** Microsoft OAuth configuration */
	microsoft: microsoftAuthConfigSchema,
});

// =============================================================================
// Storage Configuration (S3-compatible)
// =============================================================================

export const storageConfigSchema = z.object({
	/** S3-compatible storage host (e.g., "s3.amazonaws.com", "minio.example.com") */
	host: z.string().min(1, "Storage host is required"),
	/** Storage region (e.g., "eu-central-1", "us-east-1") */
	region: z.string().min(1, "Storage region is required"),
	/** S3 bucket name for storing attachments */
	bucket: z.string().min(1, "Storage bucket name is required"),
	/** Use secure connection (HTTPS) */
	secure: z.boolean().default(true),
	/** Force path-style URLs instead of virtual-hosted-style */
	forcePathStyle: z.boolean().default(false),
	// Note: accessKeyId and secretAccessKey are provided via env vars
});

// =============================================================================
// Upload Configuration
// =============================================================================

export const uploadConfigSchema = z.object({
	/** Maximum file size in bytes (default: 5MB) */
	maxFileSize: z
		.number()
		.positive()
		.default(5 * 1024 * 1024),
	/** Maximum number of files per upload (default: 5) */
	maxFiles: z.number().positive().int().default(5),
});

// =============================================================================
// Email Configuration
// =============================================================================

export const emailConfigSchema = z.object({
	/** Email address used as the sender (From field) */
	from: z.string().email("Invalid email address for 'from' field"),
	/** Reply-to email address (optional) */
	replyTo: z
		.string()
		.email("Invalid email address for 'replyTo' field")
		.optional(),
	// Note: RESEND_API_KEY is provided via env var
	provider: z.enum(["resend", "SES"]),
});

// =============================================================================
// Root Configuration Schema
// =============================================================================

export const configSchema = z.object({
	/** Application settings */
	app: appConfigSchema,
	/** Database connection settings */
	database: databaseConfigSchema,
	/** Authentication settings */
	auth: authConfigSchema,
	/** S3-compatible storage settings */
	storage: storageConfigSchema,
	/** File upload limits (optional - has sensible defaults) */
	upload: uploadConfigSchema.optional().default({
		maxFileSize: 5 * 1024 * 1024,
		maxFiles: 5,
	}),
	/** Email service settings */
	email: emailConfigSchema,
});

// =============================================================================
// Type Exports
// =============================================================================

/** Full application configuration type */
export type Config = z.infer<typeof configSchema>;

/** App configuration type */
export type AppConfig = z.infer<typeof appConfigSchema>;

/** Database configuration type */
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

/** Authentication configuration type */
export type AuthConfig = z.infer<typeof authConfigSchema>;

/** Microsoft authentication configuration type */
export type MicrosoftAuthConfig = z.infer<typeof microsoftAuthConfigSchema>;

/** Storage configuration type */
export type StorageConfig = z.infer<typeof storageConfigSchema>;

/** Upload configuration type */
export type UploadConfig = z.infer<typeof uploadConfigSchema>;

/** Email configuration type */
export type EmailConfig = z.infer<typeof emailConfigSchema>;

// =============================================================================
// Input Type (for config file - before defaults are applied)
// =============================================================================

/** Input type for config file (allows optional fields with defaults) */
export type ConfigInput = z.input<typeof configSchema>;

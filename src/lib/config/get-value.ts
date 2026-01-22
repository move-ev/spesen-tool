import { env } from "@/env";
import { getConfig, loadConfig } from "./loader";
import type { Config } from "./schema";

/**
 * Configuration value getters with environment variable override support
 *
 * These functions provide access to configuration values, with environment
 * variables taking precedence over config file values when set.
 *
 * Priority order:
 * 1. Environment variable (if set) - for CI/CD and runtime overrides
 * 2. Config file value - primary configuration source
 * 3. Default value (if provided)
 */

// Cached config reference
let _cachedConfig: Config | null = null;

/**
 * Initialize configuration (call once at app startup)
 */
export async function initializeConfig(): Promise<Config> {
	const result = await loadConfig();
	_cachedConfig = result.config;
	return _cachedConfig;
}

/**
 * Get config synchronously (for use after initialization)
 * Falls back to env vars if config not yet loaded
 */
function getConfigSafe(): Config | null {
	if (_cachedConfig) return _cachedConfig;

	try {
		_cachedConfig = getConfig();
		return _cachedConfig;
	} catch {
		return null;
	}
}

// =============================================================================
// Database Configuration
// =============================================================================

/**
 * Get database URL
 * Priority: DATABASE_URL env var > config.database.url
 */
export function getDatabaseUrl(): string {
	// Environment variable override
	if (env.DATABASE_URL) {
		return env.DATABASE_URL;
	}

	// Config file value
	const config = getConfigSafe();
	if (config?.database?.url) {
		return config.database.url;
	}

	throw new Error(
		"Database URL not configured. Set DATABASE_URL environment variable or configure database.url in config.ts",
	);
}

/**
 * Get database logging configuration
 */
export function getDatabaseLogging(): ("query" | "error" | "warn" | "info")[] {
	const config = getConfigSafe();

	if (config?.database?.logging) {
		return config.database.logging;
	}

	// Default based on NODE_ENV
	return env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];
}

// =============================================================================
// Authentication Configuration
// =============================================================================

/**
 * Get auth base URL
 * Priority: BETTER_AUTH_URL env var > config.auth.url
 */
export function getAuthUrl(): string {
	if (env.BETTER_AUTH_URL) {
		return env.BETTER_AUTH_URL;
	}

	const config = getConfigSafe();
	if (config?.auth?.url) {
		return config.auth.url;
	}

	throw new Error(
		"Auth URL not configured. Set BETTER_AUTH_URL environment variable or configure auth.url in config.ts",
	);
}

/**
 * Get Microsoft tenant ID
 * Priority: MICROSOFT_TENANT_ID env var > config.auth.microsoft.tenantId
 */
export function getMicrosoftTenantId(): string {
	if (env.MICROSOFT_TENANT_ID) {
		return env.MICROSOFT_TENANT_ID;
	}

	const config = getConfigSafe();
	if (config?.auth?.microsoft?.tenantId) {
		return config.auth.microsoft.tenantId;
	}

	throw new Error(
		"Microsoft tenant ID not configured. Set MICROSOFT_TENANT_ID environment variable or configure auth.microsoft.tenantId in config.ts",
	);
}

/**
 * Get Microsoft client ID
 * Priority: MICROSOFT_CLIENT_ID env var > config.auth.microsoft.clientId
 */
export function getMicrosoftClientId(): string {
	if (env.MICROSOFT_CLIENT_ID) {
		return env.MICROSOFT_CLIENT_ID;
	}

	const config = getConfigSafe();
	if (config?.auth?.microsoft?.clientId) {
		return config.auth.microsoft.clientId;
	}

	throw new Error(
		"Microsoft client ID not configured. Set MICROSOFT_CLIENT_ID environment variable or configure auth.microsoft.clientId in config.ts",
	);
}

// =============================================================================
// Storage Configuration
// =============================================================================

/**
 * Get storage host
 * Priority: STORAGE_HOST env var > config.storage.host
 */
export function getStorageHost(): string {
	if (env.STORAGE_HOST) {
		return env.STORAGE_HOST;
	}

	const config = getConfigSafe();
	if (config?.storage?.host) {
		return config.storage.host;
	}

	throw new Error(
		"Storage host not configured. Set STORAGE_HOST environment variable or configure storage.host in config.ts",
	);
}

/**
 * Get storage region
 * Priority: STORAGE_REGION env var > config.storage.region
 */
export function getStorageRegion(): string {
	if (env.STORAGE_REGION) {
		return env.STORAGE_REGION;
	}

	const config = getConfigSafe();
	if (config?.storage?.region) {
		return config.storage.region;
	}

	throw new Error(
		"Storage region not configured. Set STORAGE_REGION environment variable or configure storage.region in config.ts",
	);
}

/**
 * Get storage bucket name
 * Priority: STORAGE_BUCKET env var > config.storage.bucket
 */
export function getStorageBucket(): string {
	if (env.STORAGE_BUCKET) {
		return env.STORAGE_BUCKET;
	}

	const config = getConfigSafe();
	if (config?.storage?.bucket) {
		return config.storage.bucket;
	}

	throw new Error(
		"Storage bucket not configured. Set STORAGE_BUCKET environment variable or configure storage.bucket in config.ts",
	);
}

/**
 * Get storage secure setting
 */
export function getStorageSecure(): boolean {
	const config = getConfigSafe();
	return config?.storage?.secure ?? true;
}

/**
 * Get storage forcePathStyle setting
 */
export function getStorageForcePathStyle(): boolean {
	const config = getConfigSafe();
	return config?.storage?.forcePathStyle ?? false;
}

// =============================================================================
// Upload Configuration
// =============================================================================

/**
 * Get max file size for uploads
 */
export function getUploadMaxFileSize(): number {
	const config = getConfigSafe();
	return config?.upload?.maxFileSize ?? 5 * 1024 * 1024; // 5MB default
}

/**
 * Get max number of files per upload
 */
export function getUploadMaxFiles(): number {
	const config = getConfigSafe();
	return config?.upload?.maxFiles ?? 5;
}

// =============================================================================
// Email Configuration
// =============================================================================

/**
 * Get email from address
 * Priority: EMAIL_FROM env var > config.email.from
 */
export function getEmailFrom(): string {
	if (env.EMAIL_FROM) {
		return env.EMAIL_FROM;
	}

	const config = getConfigSafe();
	if (config?.email?.from) {
		return config.email.from;
	}

	throw new Error(
		"Email from address not configured. Set EMAIL_FROM environment variable or configure email.from in config.ts",
	);
}

/**
 * Get email reply-to address
 */
export function getEmailReplyTo(): string | undefined {
	const config = getConfigSafe();
	return config?.email?.replyTo;
}

// =============================================================================
// App Configuration
// =============================================================================

/**
 * Get app name
 */
export function getAppName(): string {
	const config = getConfigSafe();
	return config?.app?.name ?? "Spesen Tool";
}

/**
 * Get app URL
 */
export function getAppUrl(): string {
	const config = getConfigSafe();
	if (config?.app?.url) {
		return config.app.url;
	}

	// Fall back to auth URL
	return getAuthUrl();
}

/**
 * Get superuser ID
 * Priority: SUPERUSER_ID env var > config.app.superuserId
 */
export function getSuperuserId(): string {
	if (env.SUPERUSER_ID) {
		return env.SUPERUSER_ID;
	}

	const config = getConfigSafe();
	if (config?.app?.superuserId) {
		return config.app.superuserId;
	}

	throw new Error(
		"Superuser ID not configured. Set SUPERUSER_ID environment variable or configure app.superuserId in config.ts",
	);
}

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
 * Check if we're in build/validation skip mode
 * During Docker builds, config might not be available
 */
function isBuildMode(): boolean {
	return !!process.env.SKIP_ENV_VALIDATION;
}

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

/**
 * Get a required config value, or return a placeholder during build
 */
function getRequiredValue(
	envValue: string | undefined,
	configValue: string | undefined,
	errorMessage: string,
	buildPlaceholder = "__BUILD_PLACEHOLDER__",
): string {
	// Environment variable override
	if (envValue) {
		return envValue;
	}

	// Config file value
	if (configValue) {
		return configValue;
	}

	// During build time, return placeholder instead of throwing
	if (isBuildMode()) {
		return buildPlaceholder;
	}

	throw new Error(errorMessage);
}

// =============================================================================
// Database Configuration
// =============================================================================

/**
 * Get database URL
 * Priority: DATABASE_URL env var > config.database.url
 */
export function getDatabaseUrl(): string {
	const config = getConfigSafe();
	return getRequiredValue(
		env.DATABASE_URL,
		config?.database?.url,
		"Database URL not configured. Set DATABASE_URL environment variable or configure database.url in config.ts",
		"postgresql://placeholder:placeholder@localhost:5432/placeholder",
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
	const config = getConfigSafe();
	return getRequiredValue(
		env.BETTER_AUTH_URL,
		config?.auth?.url,
		"Auth URL not configured. Set BETTER_AUTH_URL environment variable or configure auth.url in config.ts",
		"http://localhost:3000",
	);
}

/**
 * Get Microsoft tenant ID
 * Priority: MICROSOFT_TENANT_ID env var > config.auth.microsoft.tenantId
 */
export function getMicrosoftTenantId(): string {
	const config = getConfigSafe();
	return getRequiredValue(
		env.MICROSOFT_TENANT_ID,
		config?.auth?.microsoft?.tenantId,
		"Microsoft tenant ID not configured. Set MICROSOFT_TENANT_ID environment variable or configure auth.microsoft.tenantId in config.ts",
	);
}

/**
 * Get Microsoft client ID
 * Priority: MICROSOFT_CLIENT_ID env var > config.auth.microsoft.clientId
 */
export function getMicrosoftClientId(): string {
	const config = getConfigSafe();
	return getRequiredValue(
		env.MICROSOFT_CLIENT_ID,
		config?.auth?.microsoft?.clientId,
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
	const config = getConfigSafe();
	return getRequiredValue(
		env.STORAGE_HOST,
		config?.storage?.host,
		"Storage host not configured. Set STORAGE_HOST environment variable or configure storage.host in config.ts",
		"s3.placeholder.com",
	);
}

/**
 * Get storage region
 * Priority: STORAGE_REGION env var > config.storage.region
 */
export function getStorageRegion(): string {
	const config = getConfigSafe();
	return getRequiredValue(
		env.STORAGE_REGION,
		config?.storage?.region,
		"Storage region not configured. Set STORAGE_REGION environment variable or configure storage.region in config.ts",
		"us-east-1",
	);
}

/**
 * Get storage bucket name
 * Priority: STORAGE_BUCKET env var > config.storage.bucket
 */
export function getStorageBucket(): string {
	const config = getConfigSafe();
	return getRequiredValue(
		env.STORAGE_BUCKET,
		config?.storage?.bucket,
		"Storage bucket not configured. Set STORAGE_BUCKET environment variable or configure storage.bucket in config.ts",
		"placeholder-bucket",
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
	const config = getConfigSafe();
	return getRequiredValue(
		env.EMAIL_FROM,
		config?.email?.from,
		"Email from address not configured. Set EMAIL_FROM environment variable or configure email.from in config.ts",
		"noreply@placeholder.com",
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
	const config = getConfigSafe();
	return getRequiredValue(
		env.SUPERUSER_ID,
		config?.app?.superuserId,
		"Superuser ID not configured. Set SUPERUSER_ID environment variable or configure app.superuserId in config.ts",
	);
}

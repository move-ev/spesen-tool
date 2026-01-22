/**
 * Configuration Module
 *
 * This module provides a type-safe configuration system for the Spesen Tool.
 *
 * Usage:
 * ```typescript
 * import { config } from "@/lib/config";
 *
 * // Access configuration values
 * console.log(config.app.name);
 * console.log(config.database.url);
 * ```
 *
 * Configuration is loaded from:
 * 1. config.ts file in project root (preferred for self-hosting)
 * 2. Environment variables (fallback, for backward compatibility)
 *
 * Secrets (API keys, passwords) should always be provided via environment variables.
 */

// Re-export defaults
export {
	DEFAULT_APP_NAME,
	DEFAULT_STORAGE_FORCE_PATH_STYLE,
	DEFAULT_STORAGE_SECURE,
	DEFAULT_UPLOAD_CONFIG,
	DEV_DATABASE_LOGGING,
	PROD_DATABASE_LOGGING,
} from "./defaults";
// Re-export config value getters
export {
	getAppName,
	getAppUrl,
	getAuthUrl,
	getDatabaseLogging,
	getDatabaseUrl,
	getEmailFrom,
	getEmailReplyTo,
	getMicrosoftClientId,
	getMicrosoftTenantId,
	getStorageBucket,
	getStorageForcePathStyle,
	getStorageHost,
	getStorageRegion,
	getStorageSecure,
	getSuperuserId,
	getUploadMaxFileSize,
	getUploadMaxFiles,
	initializeConfig,
} from "./get-value";

// Re-export loader functions
export {
	ConfigFileNotFoundError,
	type ConfigLoadResult,
	ConfigValidationError,
	clearConfigCache,
	getConfig,
	getConfigResult,
	loadConfig,
} from "./loader";
// Re-export types
export type {
	AppConfig,
	AuthConfig,
	Config,
	ConfigInput,
	DatabaseConfig,
	EmailConfig,
	MicrosoftAuthConfig,
	StorageConfig,
	UploadConfig,
} from "./schema";
// Re-export schema for validation
export { configSchema } from "./schema";

// =============================================================================
// Synchronous Config Access
// =============================================================================

import { getConfig, loadConfig } from "./loader";
import type { Config } from "./schema";

/**
 * Lazily initialized configuration object
 *
 * This provides synchronous access to configuration after it has been loaded.
 * The configuration is loaded automatically on first access.
 *
 * Note: For server startup, prefer using `loadConfig()` explicitly to handle
 * errors gracefully before the application starts serving requests.
 */
let _config: Config | null = null;
let _configPromise: Promise<Config> | null = null;

/**
 * Initialize configuration (call this during app startup)
 *
 * This should be called early in the application lifecycle to ensure
 * configuration is loaded and validated before use.
 */
export async function initConfig(): Promise<Config> {
	if (_config) {
		return _config;
	}

	if (_configPromise) {
		return _configPromise;
	}

	_configPromise = loadConfig()
		.then((result) => {
			_config = result.config;
			return _config;
		})
		.catch((error) => {
			// Reset promise on failure to allow retry on transient errors
			_configPromise = null;
			throw error;
		});

	return _configPromise;
}

/**
 * Get configuration synchronously
 *
 * @throws Error if configuration hasn't been initialized yet
 */
export function config(): Config {
	if (!_config) {
		// Try to get from loader cache
		try {
			_config = getConfig();
		} catch {
			throw new Error(
				"Configuration not initialized. Call initConfig() during application startup.",
			);
		}
	}
	return _config;
}

/**
 * Check if configuration has been initialized
 */
export function isConfigInitialized(): boolean {
	return _config !== null;
}

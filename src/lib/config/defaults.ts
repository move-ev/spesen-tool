import type { UploadConfig } from "./schema";

/**
 * Default configuration values
 *
 * These defaults are applied when values are not specified in the config file.
 * Required fields (without defaults) must be provided in the config file.
 */

// =============================================================================
// App Defaults
// =============================================================================

export const DEFAULT_APP_NAME = "Spesen Tool";

// =============================================================================
// Upload Defaults
// =============================================================================

/** Default upload configuration */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
	/** 5MB default max file size */
	maxFileSize: 5 * 1024 * 1024,
	/** 5 files max per upload */
	maxFiles: 5,
};

// =============================================================================
// Storage Defaults
// =============================================================================

/** Use HTTPS by default */
export const DEFAULT_STORAGE_SECURE = true;

/** Use virtual-hosted-style URLs by default (AWS S3 standard) */
export const DEFAULT_STORAGE_FORCE_PATH_STYLE = false;

// =============================================================================
// Database Logging Defaults
// =============================================================================

/** Development logging levels */
export const DEV_DATABASE_LOGGING = ["query", "error", "warn"] as const;

/** Production logging levels */
export const PROD_DATABASE_LOGGING = ["error"] as const;

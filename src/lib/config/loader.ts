import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { type Config, type ConfigInput, configSchema } from "./schema";

// =============================================================================
// Types
// =============================================================================

export interface ConfigLoadResult {
	config: Config;
	source: "file" | "env";
	filePath?: string;
}

export class ConfigValidationError extends Error {
	constructor(
		message: string,
		public readonly errors: Array<{ path: string; message: string }>,
		public readonly source: string,
	) {
		super(message);
		this.name = "ConfigValidationError";
	}

	/**
	 * Format errors for console output
	 */
	formatErrors(): string {
		const lines = [
			`\n┌─────────────────────────────────────────────────────────────┐`,
			`│  Configuration Error                                        │`,
			`└─────────────────────────────────────────────────────────────┘`,
			``,
			`Source: ${this.source}`,
			``,
			`The following configuration errors were found:`,
			``,
		];

		for (const error of this.errors) {
			lines.push(`  ✗ ${error.path}: ${error.message}`);
		}

		lines.push(``);
		lines.push(`Please check your configuration file and try again.`);
		lines.push(`See config.example.ts for a complete reference.`);
		lines.push(``);

		return lines.join("\n");
	}
}

export class ConfigFileNotFoundError extends Error {
	constructor(public readonly searchedPaths: string[]) {
		super("Configuration file not found");
		this.name = "ConfigFileNotFoundError";
	}

	formatError(): string {
		const lines = [
			`\n┌─────────────────────────────────────────────────────────────┐`,
			`│  Configuration File Not Found                               │`,
			`└─────────────────────────────────────────────────────────────┘`,
			``,
			`No configuration file was found. Searched locations:`,
			``,
		];

		for (const path of this.searchedPaths) {
			lines.push(`  • ${path}`);
		}

		lines.push(``);
		lines.push(`To get started:`);
		lines.push(`  1. Copy config.example.ts to config.ts`);
		lines.push(`  2. Edit config.ts with your settings`);
		lines.push(`  3. Set required environment variables for secrets`);
		lines.push(``);
		lines.push(`Alternatively, set CONFIG_PATH environment variable to specify`);
		lines.push(`a custom configuration file location.`);
		lines.push(``);

		return lines.join("\n");
	}
}

// =============================================================================
// Config Loading
// =============================================================================

/**
 * Resolve the config file path
 *
 * Search order:
 * 1. CONFIG_PATH environment variable (if set)
 * 2. config.ts in project root
 * 3. config.js in project root (for compiled configs)
 */
function resolveConfigPath(): string | null {
	// Check CONFIG_PATH env var first
	const envConfigPath = process.env.CONFIG_PATH;
	if (envConfigPath) {
		const absolutePath = resolve(process.cwd(), envConfigPath);
		if (existsSync(absolutePath)) {
			return absolutePath;
		}
		// If CONFIG_PATH is set but file doesn't exist, throw error
		throw new ConfigFileNotFoundError([absolutePath]);
	}

	// Search default locations
	const searchPaths = [
		resolve(process.cwd(), "config.ts"),
		resolve(process.cwd(), "config.js"),
	];

	for (const path of searchPaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	return null;
}

/**
 * Load configuration from file
 */
async function loadConfigFile(filePath: string): Promise<ConfigInput> {
	try {
		// Dynamic import of the config file
		// For .ts files, we need jiti to handle TypeScript at runtime
		let configModule: Record<string, unknown>;

		if (filePath.endsWith(".ts")) {
			// Use jiti to load TypeScript files at runtime
			const { createJiti } = await import("jiti");
			const jiti = createJiti(import.meta.url);
			configModule = (await jiti.import(filePath)) as Record<string, unknown>;
		} else {
			// For .js files, use native dynamic import
			configModule = await import(filePath);
		}

		// Support both default export and named 'config' export
		const rawConfig = configModule.default ?? configModule.config;

		if (!rawConfig) {
			throw new Error(
				`Config file must export a default configuration object.\n` +
					`Example: export default { app: { ... }, database: { ... }, ... }`,
			);
		}

		return rawConfig as ConfigInput;
	} catch (error) {
		if (error instanceof Error && error.message.includes("Cannot find module")) {
			throw new ConfigFileNotFoundError([filePath]);
		}
		throw error;
	}
}

/**
 * Safely parse an integer from an environment variable
 * Returns undefined if the value is not set or not a valid integer
 * Throws a clear error if the value is set but not a valid number
 */
function parseIntEnv(
	value: string | undefined,
	envName: string,
): number | undefined {
	if (!value) {
		return undefined;
	}

	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed)) {
		throw new Error(
			`Invalid value for ${envName}: "${value}" is not a valid integer`,
		);
	}

	return parsed;
}

/**
 * Build configuration from environment variables only (fallback mode)
 *
 * This allows existing env-var-only setups to continue working
 */
function buildConfigFromEnv(): ConfigInput {
	const env = process.env;

	return {
		app: {
			name: env.APP_NAME ?? "Spesen Tool",
			url: env.BETTER_AUTH_URL ?? "",
			superuserId: env.SUPERUSER_ID ?? "",
		},
		database: {
			url: env.DATABASE_URL ?? "",
		},
		auth: {
			url: env.BETTER_AUTH_URL ?? "",
			microsoft: {
				tenantId: env.MICROSOFT_TENANT_ID ?? "",
				clientId: env.MICROSOFT_CLIENT_ID ?? "",
			},
		},
		storage: {
			host: env.STORAGE_HOST ?? "",
			region: env.STORAGE_REGION ?? "",
			bucket: env.STORAGE_BUCKET ?? "spesen-tool",
		},
		upload: {
			maxFileSize: parseIntEnv(env.UPLOAD_MAX_FILE_SIZE, "UPLOAD_MAX_FILE_SIZE"),
			maxFiles: parseIntEnv(env.UPLOAD_MAX_FILES, "UPLOAD_MAX_FILES"),
		},
		email: {
			from: env.EMAIL_FROM ?? "",
			replyTo: env.EMAIL_REPLY_TO,
			provider: "resend",
		},
	};
}

/**
 * Validate configuration against schema
 */
function validateConfig(config: ConfigInput, source: string): Config {
	try {
		return configSchema.parse(config);
	} catch (error) {
		if (error instanceof ZodError) {
			const errors = error.issues.map((issue) => ({
				path: issue.path.join(".") || "(root)",
				message: issue.message,
			}));
			throw new ConfigValidationError(
				`Invalid configuration in ${source}`,
				errors,
				source,
			);
		}
		throw error;
	}
}

// =============================================================================
// Public API
// =============================================================================

/** Cached configuration (singleton) */
let cachedConfig: ConfigLoadResult | null = null;

/**
 * Load and validate configuration
 *
 * Configuration is loaded once and cached for subsequent calls.
 * Throws ConfigValidationError if configuration is invalid.
 *
 * @param options.force - Force reload configuration (ignore cache)
 * @returns Validated configuration object
 */
export async function loadConfig(options?: {
	force?: boolean;
}): Promise<ConfigLoadResult> {
	// Return cached config if available
	if (cachedConfig && !options?.force) {
		return cachedConfig;
	}

	// Skip config loading if SKIP_ENV_VALIDATION is set (for Docker builds)
	if (process.env.SKIP_ENV_VALIDATION) {
		// Return a minimal config that passes validation
		// Real config will be loaded at runtime
		const minimalConfig = buildConfigFromEnv();
		const validated = validateConfig(minimalConfig, "environment variables");
		cachedConfig = { config: validated, source: "env" };
		return cachedConfig;
	}

	// Try to find and load config file
	const configPath = resolveConfigPath();

	if (configPath) {
		// Load from file
		const rawConfig = await loadConfigFile(configPath);
		const validated = validateConfig(rawConfig, configPath);
		cachedConfig = { config: validated, source: "file", filePath: configPath };
		return cachedConfig;
	}

	// Fallback to environment variables
	const envConfig = buildConfigFromEnv();
	const validated = validateConfig(envConfig, "environment variables");
	cachedConfig = { config: validated, source: "env" };
	return cachedConfig;
}

/**
 * Get configuration synchronously (must call loadConfig first)
 *
 * @throws Error if config hasn't been loaded yet
 */
export function getConfig(): Config {
	if (!cachedConfig) {
		throw new Error(
			"Configuration not loaded. Call loadConfig() first during application startup.",
		);
	}
	return cachedConfig.config;
}

/**
 * Get configuration load result (includes source info)
 */
export function getConfigResult(): ConfigLoadResult | null {
	return cachedConfig;
}

/**
 * Clear cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
	cachedConfig = null;
}

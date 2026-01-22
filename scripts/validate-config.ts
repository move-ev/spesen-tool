#!/usr/bin/env tsx
/**
 * Configuration Validation CLI
 *
 * This script validates the configuration file without starting the application.
 * Use it to check your config before deployment.
 *
 * Usage:
 *   pnpm config:validate
 *   pnpm config:validate --verbose
 *   CONFIG_PATH=./my-config.ts pnpm config:validate
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

// Parse command line arguments
const { values: args } = parseArgs({
	options: {
		verbose: {
			type: "boolean",
			short: "v",
			default: false,
		},
		help: {
			type: "boolean",
			short: "h",
			default: false,
		},
		config: {
			type: "string",
			short: "c",
		},
	},
});

// Show help
if (args.help) {
	console.log(`
Spesen Tool Configuration Validator

Usage:
  pnpm config:validate [options]

Options:
  -c, --config <path>  Path to config file (default: config.ts)
  -v, --verbose        Show detailed configuration output
  -h, --help           Show this help message

Environment Variables:
  CONFIG_PATH          Alternative way to specify config file path
  SKIP_ENV_VALIDATION  Skip environment variable validation

Examples:
  pnpm config:validate
  pnpm config:validate --verbose
  pnpm config:validate --config ./configs/production.ts
  CONFIG_PATH=./my-config.ts pnpm config:validate
`);
	process.exit(0);
}

// Set config path if provided via CLI
if (args.config) {
	process.env.CONFIG_PATH = args.config;
}

// Main validation function
async function validateConfig() {
	console.log("\n🔍 Validating Spesen Tool configuration...\n");

	// Determine config path
	const configPath = process.env.CONFIG_PATH || "config.ts";
	const absolutePath = resolve(process.cwd(), configPath);

	// Check if config file exists
	if (!existsSync(absolutePath)) {
		console.error("❌ Configuration file not found!");
		console.error(`   Searched: ${absolutePath}\n`);
		console.error("   To get started:");
		console.error("   1. Copy config.example.ts to config.ts");
		console.error("   2. Edit config.ts with your settings");
		console.error("   3. Run this command again\n");
		process.exit(1);
	}

	console.log(`📄 Config file: ${absolutePath}`);

	// Import the config loader (dynamically to avoid circular dependencies)
	const { loadConfig, ConfigValidationError, ConfigFileNotFoundError } =
		await import("../src/lib/config/loader.js");

	try {
		const result = await loadConfig({ force: true });

		console.log("\n✅ Configuration is valid!\n");

		if (args.verbose) {
			console.log("📋 Configuration summary:");
			console.log("─".repeat(50));
			console.log(`   App Name:      ${result.config.app.name}`);
			console.log(`   App URL:       ${result.config.app.url}`);
			console.log(`   Superuser ID:  ${result.config.app.superuserId}`);
			console.log(`   Database URL:  ${maskSecret(result.config.database.url)}`);
			console.log(`   Auth URL:      ${result.config.auth.url}`);
			console.log(`   MS Tenant ID:  ${result.config.auth.microsoft.tenantId}`);
			console.log(`   MS Client ID:  ${result.config.auth.microsoft.clientId}`);
			console.log(`   Storage Host:  ${result.config.storage.host}`);
			console.log(`   Storage Region: ${result.config.storage.region}`);
			console.log(`   Storage Bucket: ${result.config.storage.bucket}`);
			console.log(
				`   Max File Size: ${formatBytes(result.config.upload.maxFileSize)}`,
			);
			console.log(`   Max Files:     ${result.config.upload.maxFiles}`);
			console.log(`   Email From:    ${result.config.email.from}`);
			if (result.config.email.replyTo) {
				console.log(`   Email Reply-To: ${result.config.email.replyTo}`);
			}
			console.log("─".repeat(50));
		}

		console.log("🔐 Required environment variables:");
		checkEnvVar("BETTER_AUTH_SECRET", process.env.NODE_ENV === "production");
		checkEnvVar("MICROSOFT_CLIENT_SECRET", true);
		checkEnvVar("STORAGE_ACCESS_KEY_ID", true);
		checkEnvVar("STORAGE_ACCESS_KEY", true);
		checkEnvVar("RESEND_API_KEY", true);

		console.log("");
		process.exit(0);
	} catch (error) {
		if (error instanceof ConfigValidationError) {
			console.error("\n❌ Configuration validation failed!\n");
			console.error(error.formatErrors());
			process.exit(1);
		}

		if (error instanceof ConfigFileNotFoundError) {
			console.error("\n❌ Configuration file not found!\n");
			console.error(error.formatError());
			process.exit(1);
		}

		console.error("\n❌ Unexpected error during validation:\n");
		console.error(error);
		process.exit(1);
	}
}

// Helper: Mask sensitive values in URLs
function maskSecret(url: string): string {
	try {
		const parsed = new URL(url);
		if (parsed.password) {
			parsed.password = "****";
		}
		return parsed.toString();
	} catch {
		return url;
	}
}

// Helper: Format bytes to human readable
function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper: Check if environment variable is set
function checkEnvVar(name: string, required: boolean): void {
	const value = process.env[name];
	const status = value ? "✓" : required ? "✗" : "○";
	const label = value ? "set" : required ? "MISSING" : "optional";

	console.log(`   ${status} ${name}: ${label}`);
}

// Run validation
validateConfig().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});

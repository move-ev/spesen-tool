/**
 * Next.js Instrumentation
 *
 * This file runs once when the Next.js server starts.
 * Used to initialize configuration and other startup tasks.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
	// Only run on the server (not during build or on edge)
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { loadConfig, ConfigValidationError, ConfigFileNotFoundError } =
			await import("@/lib/config/loader");

		try {
			const result = await loadConfig();

			if (result.source === "file") {
				console.log(`[Config] Loaded configuration from ${result.filePath}`);
			} else {
				console.log("[Config] Using configuration from environment variables");
			}
		} catch (error) {
			if (error instanceof ConfigValidationError) {
				console.error(error.formatErrors());
				process.exit(1);
			}

			if (error instanceof ConfigFileNotFoundError) {
				// Config file not found is okay - fall back to env vars
				console.log("[Config] No config file found, using environment variables");
			} else {
				console.error("[Config] Failed to load configuration:", error);
				process.exit(1);
			}
		}
	}
}

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			// `server-only` throws unconditionally outside Next.js's bundler.
			// Aliased to a local no-op rather than flipping a resolve condition
			// for the whole process, so no other package's conditional exports
			// (React, Next.js internals) are affected.
			"server-only": fileURLToPath(
				new URL("./vitest.server-only-stub.ts", import.meta.url),
			),
		},
	},
	test: {
		environment: "node",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text"],
		},
	},
});

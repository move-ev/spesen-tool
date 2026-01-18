import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		BETTER_AUTH_SECRET:
			process.env.NODE_ENV === "production" ? z.string() : z.string().optional(),
		BETTER_AUTH_URL: z.url(),
		DATABASE_URL: z.url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),

		MICROSOFT_CLIENT_ID: z.string(),
		MICROSOFT_CLIENT_SECRET: z.string(),
		MICROSOFT_TENANT_ID: z.string(),

		STORAGE_HOST: z.string(),
		STORAGE_ACCESS_KEY_ID: z.string(),
		STORAGE_ACCESS_KEY: z.string(),
		STORAGE_REGION: z.string(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// NEXT_PUBLIC_CLIENTVAR: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
		MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
		MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID,
		STORAGE_HOST: process.env.STORAGE_HOST,
		STORAGE_ACCESS_KEY_ID: process.env.STORAGE_ACCESS_KEY_ID,
		STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY,
		STORAGE_REGION: process.env.STORAGE_REGION,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});

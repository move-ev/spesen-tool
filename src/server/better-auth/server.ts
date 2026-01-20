import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { env } from "@/env";
import { db } from "@/server/db";

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: "postgresql", // or "sqlite" or "mysql"
	}),
	trustedOrigins: [
		env.BETTER_AUTH_URL,
		...(env.NODE_ENV === "development"
			? ["http://localhost:3000", "http://127.0.0.1:3000"]
			: []),
	],
	emailAndPassword: {
		enabled: false,
	},
	socialProviders: {
		microsoft: {
			clientId: env.MICROSOFT_CLIENT_ID,
			clientSecret: env.MICROSOFT_CLIENT_SECRET,
			tenantId: env.MICROSOFT_TENANT_ID,
			authority: "https://login.microsoftonline.com",
			prompt: "select_account",
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					// Automatically create preferences entry when a new user signs up
					await db.preferences.create({
						data: {
							userId: user.id,
							notificationPreference: "ALL",
						},
					});
				},
			},
		},
	},
	plugins: [adminPlugin(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

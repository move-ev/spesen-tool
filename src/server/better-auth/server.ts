import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { env } from "@/env";
import {
	getAuthUrl,
	getMicrosoftClientId,
	getMicrosoftTenantId,
} from "@/lib/config";
import { db } from "@/server/db";

// Get configuration values
const authUrl = getAuthUrl();
const microsoftTenantId = getMicrosoftTenantId();
const microsoftClientId = getMicrosoftClientId();

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	trustedOrigins: [
		authUrl,
		...(env.NODE_ENV === "development"
			? ["http://localhost:3000", "http://127.0.0.1:3000"]
			: []),
	],
	emailAndPassword: {
		enabled: false,
	},
	socialProviders: {
		microsoft: {
			clientId: microsoftClientId,
			clientSecret: env.MICROSOFT_CLIENT_SECRET,
			tenantId: microsoftTenantId,
			authority: "https://login.microsoftonline.com",
			prompt: "select_account",
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					// Automatically create preferences entry when a new user signs up
					try {
						await db.preferences.create({
							data: {
								userId: user.id,
								notifications: "ALL",
							},
						});
					} catch (error) {
						console.error("Failed to create user preferences:", error);
					}
				},
			},
		},
	},
	plugins: [adminPlugin(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

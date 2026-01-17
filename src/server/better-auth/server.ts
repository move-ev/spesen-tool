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
	emailAndPassword: {
		enabled: false,
	},
	socialProviders: {
		microsoft: {
			clientId: env.MICROSOFT_CLIENT_ID as string,
			clientSecret: env.MICROSOFT_CLIENT_SECRET as string,
			tenantId: "6f1276a0-6c96-449b-a10f-1a3d157a8bc4",
			authority: "https://login.microsoftonline.com",
			prompt: "select_account",
		},
	},
	plugins: [adminPlugin(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { env } from "@/env";
import { db } from "@/server/db";

const ALLOWED_EMAIL_DOMAIN = "@move-ev.de";

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: [
		env.BETTER_AUTH_URL,
		"http://localhost:3000",
		"http://127.0.0.1:3000",
	],
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
			tenantId: "common",
			authority: "https://login.microsoftonline.com",
			// Force Microsoft to show the account picker every time
			prompt: "select_account",
			mapProfileToUser: (profile) => {
				const email = profile.email ?? profile.userPrincipalName;
				const providerId = profile.id ?? profile.sub ?? profile.oid ?? email;
				// Ensure provider id is stable for account linking
				profile.id = providerId;
				console.log("🔎 Microsoft profile:", {
					email,
					userPrincipalName: profile?.userPrincipalName,
					tenantId: profile?.tid ?? profile?.tenantId,
					issuer: profile?.iss,
					sub: profile?.sub,
					oid: profile?.oid,
				});
				if (!email) {
					console.error("❌ No email found in Microsoft profile");
					throw new Error("Microsoft profile does not contain an email address");
				}
				
				// Validate email domain BEFORE user creation
				if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
					console.error(`❌ Email domain not allowed: ${email}`);
					throw new Error(
						`Nur Benutzer mit einer ${ALLOWED_EMAIL_DOMAIN} E-Mail-Adresse können sich anmelden.`,
					);
				}
				
				// Better-auth requires name to be a string (not null/undefined)
				// Use email as fallback if name is not available
				const name = profile.name ?? profile.displayName ?? profile.givenName ?? email.split("@")[0] ?? "User";
				
				const mappedUser = {
					id: providerId,
					email: email,
					name: name,
					image: profile.picture ?? profile.photo ?? undefined,
					emailVerified: false,
				};
				
				return mappedUser;
			},
		},
	},
	plugins: [adminPlugin(), nextCookies()],
	callbacks: {
		onUserCreated: async ({ user }: { user: { id: string; name?: string | null; email?: string | null } }) => {
			// Log user creation for debugging
			console.log("✅ User created successfully:", { id: user.id, name: user.name, email: user.email });
			
			// Ensure admin field is set to false for new users
			// Use a try-catch to handle errors gracefully
			try {
				await db.user.update({
					where: { id: user.id },
					data: { admin: false },
				});
				console.log("✅ Admin field set to false for user:", user.id);
			} catch (error) {
				console.error("❌ Error setting admin field for new user:", error);
				// Don't throw - let the user creation succeed even if admin update fails
			}
		},
		onError: async ({ error, type }: { error: Error; type: string }) => {
			// Log all errors for debugging
			console.error("❌ Better-Auth Error:", { 
				type, 
				error: error.message, 
				stack: error.stack,
				errorName: error.name,
				errorString: String(error)
			});
			
			// If it's a user creation error, try to clean up partially created users
			if (type === "user.create" || error.message.includes("unable_to_create_user")) {
				console.log("🔧 Attempting to clean up partially created users...");
				try {
					// Find users without accounts (partially created)
					const orphanedUsers = await db.user.findMany({
						where: {
							accounts: {
								none: {},
							},
						},
						select: { id: true, email: true },
					});
					
					if (orphanedUsers.length > 0) {
						console.log(`Found ${orphanedUsers.length} orphaned users, deleting...`);
						for (const user of orphanedUsers) {
							await db.user.delete({ where: { id: user.id } });
							console.log(`Deleted orphaned user: ${user.email}`);
						}
					}
				} catch (cleanupError) {
					console.error("❌ Error during cleanup:", cleanupError);
				}
			}
		},
		onSignIn: async ({ user, account }: { user: { id: string; email?: string | null }; account?: unknown }) => {
						
			// Ensure admin field is set for existing users (migration safety)
			// Only update if admin is null/undefined
			try {
				const dbUser = await db.user.findUnique({
					where: { id: user.id },
					select: { admin: true },
				});
				
				if (dbUser && dbUser.admin === null) {
					await db.user.update({
						where: { id: user.id },
						data: { admin: false },
					});
				}
			} catch (error) {
				// Don't block login if this fails - log for debugging
				console.error("Error ensuring admin field:", error);
			}
			
			return true;
		},
	},
});

export type Session = typeof auth.$Infer.Session;

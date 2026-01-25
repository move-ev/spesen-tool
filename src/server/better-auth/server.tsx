import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, organization } from "better-auth/plugins";
import OrganizationInvitationEmail from "@/components/emails/organization/invitation";
import { env } from "@/env";
import { DEFAULT_EMAIL_FROM } from "@/lib/consts";
import { mailer } from "@/lib/email";
import { db } from "@/server/db";
import { admin, member, organizationAc, owner } from "./permissions";

// Get configuration values
const authUrl = env.BETTER_AUTH_URL;
const microsoftTenantId = env.MICROSOFT_TENANT_ID;
const microsoftClientId = env.MICROSOFT_CLIENT_ID;

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
	plugins: [
		adminPlugin(),
		organization({
			ac: organizationAc,
			roles: {
				owner,
				admin,
				member,
			},
			async sendInvitationEmail(data) {
				const inviteLink = `https://example.com/accept-invitation/${data.id}`;

				mailer.send({
					from: DEFAULT_EMAIL_FROM,
					to: [data.email],
					subject: `Einladung zur Organisation ${data.organization.name}`,
					react: (
						<OrganizationInvitationEmail
							inviteLink={inviteLink}
							inviterName={data.inviter.user.name}
							orgName={data.organization.name}
						/>
					),
				});
			},
		}),
		nextCookies(),
	],
});

export type Session = typeof auth.$Infer.Session;

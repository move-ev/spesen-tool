import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { admin, member, organizationAc, owner } from "./permissions";

export const authClient = createAuthClient({
	plugins: [
		adminClient(),
		organizationClient({
			ac: organizationAc,
			roles: {
				owner,
				admin,
				member,
			},
		}),
	],
});

export type Session = typeof authClient.$Infer.Session;

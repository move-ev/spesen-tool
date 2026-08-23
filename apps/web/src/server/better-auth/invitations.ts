import { env } from "@/env";
import { ROUTES } from "@/lib/consts";
import { getEmailer, logSend } from "@/server/email";

type OrganizationInvitationEmailData = {
	email: string;
	id: string;
	inviter: {
		user: {
			name?: string | null;
		};
	};
	organization: {
		name: string;
	};
};

export async function sendOrgInvitationEmail(
	data: OrganizationInvitationEmailData,
) {
	const inviterName = data.inviter.user.name ?? "Ein Teammitglied";
	const acceptUrl = new URL(
		ROUTES.ACCEPT_INVITATION(data.id),
		env.BETTER_AUTH_URL,
	).toString();

	// Best-effort: the invitation row exists either way and the link can be
	// resent, so a failed send is logged rather than failing the mutation.
	const result = await getEmailer().sendOrgInvitation({
		to: data.email,
		organizationName: data.organization.name,
		inviterName,
		acceptUrl,
	});
	logSend("email.org_invitation", result, { invitationId: data.id });
}

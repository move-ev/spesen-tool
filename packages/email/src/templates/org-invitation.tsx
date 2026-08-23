import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { createAppTranslator } from "@zemio/i18n";

interface OrgInvitationEmailProps {
	organizationName: string;
	inviterName: string;
	acceptUrl: string;
	logoUrl: string;
}

export default function OrgInvitationEmail({
	organizationName,
	inviterName,
	acceptUrl,
	logoUrl,
}: OrgInvitationEmailProps) {
	const t = createAppTranslator({ namespace: "emails.orgInvitation" });
	const tShared = createAppTranslator({ namespace: "emails.shared" });

	return (
		<Html>
			<Head />
			<Tailwind config={{}}>
				<Body className="bg-zinc-50 font-sans">
					<Preview>
						{t("preview", { inviter: inviterName, organization: organizationName })}
					</Preview>
					<Container className="bg-white px-6 py-8">
						<Img className="h-5 w-fit" src={logoUrl} />
						<Text className="mt-16 font-medium text-2xl">
							{t("heading", { organization: organizationName })}
						</Text>
						<Section>
							<Text>{t("greeting")}</Text>
							<Text>
								{t.rich("body", {
									inviter: inviterName,
									organization: organizationName,
									strong: (chunks) => <strong className="font-medium">{chunks}</strong>,
								})}
							</Text>
							<Text>
								<Button href={acceptUrl}>{t("cta")}</Button>
							</Text>
							<Text>{t("expiry")}</Text>
							<Text>
								{tShared.rich("supportPrompt", {
									email: (chunks) => (
										<Button href="mailto:support@zemio.co">{chunks}</Button>
									),
								})}
							</Text>
							<Text>
								{tShared("regards")}
								<br />
								{tShared("team")}
							</Text>
							<Hr />
							<Text className="text-xs text-zinc-500">{t("footer")}</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

OrgInvitationEmail.PreviewProps = {
	organizationName: "Move e.V.",
	inviterName: "Markus Müller",
	acceptUrl: "http://localhost:3000/accept-invitation/abcdefg",
	logoUrl: "http://localhost:3000/assets/zemio-logo-woodmark.png",
};

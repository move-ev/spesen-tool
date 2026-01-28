import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Link,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

export default function OrganizationInvitationEmail({
	orgName,
	inviterName,
	inviteLink,
}: {
	orgName: string;
	inviterName: string;
	inviteLink: string;
}) {
	return (
		<Html>
			<Head />
			<Tailwind config={{}}>
				<Body className="font-sans">
					<Container className="py-12">
						<Section>
							<Text className="font-medium text-2xl">
								Einladung zur Organisation {orgName}
							</Text>
							<Text className="text-zinc-600">Hallo,</Text>
							<Text className="text-zinc-600">
								Du wurdest von{" "}
								<strong className="font-medium text-zinc-900">{inviterName}</strong>{" "}
								eingeladen, der Organisation{" "}
								<strong className="font-medium text-zinc-900">{orgName}</strong> auf
								spesen-tool.de Plattform beizutreten. Klicke auf den folgenden Link um
								der Organisation beizutreten.
							</Text>
						</Section>
						<Section className="flex items-center justify-center rounded-lg border border-zinc-200 p-8">
							<Button
								className="mx-auto rounded-sm bg-blue-500 px-3 py-1.5 text-white"
								href={inviteLink}
							>
								Einladung annehmen
							</Button>
						</Section>
						<Section>
							<Text className="text-zinc-600">
								Wenn der Button nicht funktioniert, klicke auf den folgenden Link:{" "}
								<br />{" "}
								<Link className="text-blue-500" href={inviteLink}>
									{inviteLink}
								</Link>
							</Text>
							<Text className="text-zinc-600">
								Beste Grüße,
								<br />
								Dein move e.V. Team
							</Text>
						</Section>
						<Hr />
						<Section>
							<Text className="text-xs text-zinc-500">
								Du erhältst diese E-Mail, da du eingeladen wurdest, der Organisation{" "}
								{orgName} auf spesen-tool.de beizutreten. Solltest du keine Einladung
								erhalten haben, kannst du diese E-Mail ignorieren.
							</Text>
						</Section>
					</Container>{" "}
				</Body>
			</Tailwind>
		</Html>
	);
}

OrganizationInvitationEmail.PreviewProps = {
	orgName: "move e.V.",
	inviterName: "John Doe",
	inviteLink: "https://spesen-tool.de/invitation/1234567890",
};

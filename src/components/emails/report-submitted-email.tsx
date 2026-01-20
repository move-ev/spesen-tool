import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface ReportSubmittedEmailProps {
	title: string;
	name: string;
}
export default function ReportSubmittedEmail({
	title,
	name,
}: ReportSubmittedEmailProps) {
	return (
		<Html>
			<Head />
			<Tailwind config={{}}>
				<Body className="font-sans">
					<Preview>Dein Spesenbericht wurde eingereicht</Preview>
					<Container>
						<Text className="font-medium text-2xl">{title}</Text>
						<Section>
							<Text>Hallo {name},</Text>
							<Text>
								Hiermit bestätigen wir, dass dein Spesenbericht "{title}" erfolgreich
								eingereicht wurde. Bitte warte nun auf die Freigabe durch einen
								Reviewer.
							</Text>
							<Text>
								Wende dich bei Fragen bitte an{" "}
								<Button href="mailto:support@move-ev.de">support@move-ev.de</Button>.
							</Text>
							<Text>
								Beste Grüße,
								<br />
								Dein move e.V. Team
							</Text>
							<Hr />
							<Text className="text-xs text-zinc-500">
								Du erhältst diese E-Mail, da du einen Spesenbericht eingereicht hast.
								Solltest du keinen Spesenbericht eingereicht haben, kannst du diese
								E-Mail ignorieren.
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

ReportSubmittedEmail.PreviewProps = {
	name: "John Doe",
	title: "Report 1",
};

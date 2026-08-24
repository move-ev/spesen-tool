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

interface StatusChangedEmailProps {
	name: string;
	title: string;
	statusLabel: string;
	reportUrl: string;
	logoUrl: string;
}

export default function StatusChangedEmail({
	name,
	title,
	statusLabel,
	reportUrl,
	logoUrl,
}: StatusChangedEmailProps) {
	const t = createAppTranslator({ namespace: "emails.statusChanged" });
	const tShared = createAppTranslator({ namespace: "emails.shared" });

	return (
		<Html>
			<Head />
			<Tailwind config={{}}>
				<Body className="bg-zinc-50 font-sans">
					<Preview>{t("preview", { status: statusLabel })}</Preview>
					<Container className="bg-white px-6 py-8">
						<Img alt="zemio" className="h-5 w-fit" src={logoUrl} />
						<Text className="mt-16 font-medium text-2xl">{title}</Text>
						<Section>
							<Text>{t("greeting", { name })}</Text>
							<Text>
								{t.rich("body", {
									title,
									status: statusLabel,
									strong: (chunks) => <strong className="font-medium">{chunks}</strong>,
									link: (chunks) => <Button href={reportUrl}>{chunks}</Button>,
								})}
							</Text>

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

StatusChangedEmail.PreviewProps = {
	name: "John Doe",
	title: "Report 1",
	statusLabel: "Zur Prüfung eingereicht",
	reportUrl: "http://localhost:3000/reports/123",
	logoUrl: "http://localhost:3000/assets/zemio-logo-woodmark.png",
};

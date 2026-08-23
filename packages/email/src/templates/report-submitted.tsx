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

interface ReportSubmittedEmailProps {
	title: string;
	name: string;
	logoUrl: string;
}

export default function ReportSubmittedEmail({
	title,
	name,
	logoUrl,
}: ReportSubmittedEmailProps) {
	const t = createAppTranslator({ namespace: "emails.reportSubmitted" });
	const tShared = createAppTranslator({ namespace: "emails.shared" });

	return (
		<Html>
			<Head />
			<Tailwind config={{}}>
				<Body className="bg-zinc-50 font-sans">
					<Preview>{t("preview")}</Preview>
					<Container className="bg-white px-6 py-8">
						<Img alt="zemio" className="h-5 w-fit" src={logoUrl} />
						<Text className="mt-16 font-medium text-2xl">{title}</Text>
						<Section>
							<Text>{t("greeting", { name })}</Text>
							<Text>{t("body", { title })}</Text>
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

ReportSubmittedEmail.PreviewProps = {
	name: "John Doe",
	title: "Report 1",
	logoUrl: "http://localhost:3000/assets/zemio-logo-woodmark.png",
};

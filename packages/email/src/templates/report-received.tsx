import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { createAppTranslator } from "@zemio/i18n";

interface ReportReceivedEmailProps {
	title: string;
	submittedBy: string;
	reportUrl: string;
	logoUrl: string;
}

export default function ReportReceivedEmail({
	title,
	submittedBy,
	reportUrl,
	logoUrl,
}: ReportReceivedEmailProps) {
	const t = createAppTranslator({ namespace: "emails.reportReceived" });
	const tShared = createAppTranslator({ namespace: "emails.shared" });

	return (
		<Html>
			<Head />
			<Tailwind config={{}}>
				<Body className="bg-zinc-50 font-sans">
					<Preview>{t("preview", { title, from: submittedBy })}</Preview>
					<Container className="bg-white px-6 py-8">
						<Img alt="zemio" className="h-5 w-fit" src={logoUrl} />
						<Text className="mt-16 font-medium text-2xl">{title}</Text>
						<Section>
							<Text>{t("greeting")}</Text>
							<Text>
								{t.rich("body", {
									from: submittedBy,
									strong: (chunks) => <strong>{chunks}</strong>,
									link: (chunks) => <Link href={reportUrl}>{chunks}</Link>,
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

ReportReceivedEmail.PreviewProps = {
	submittedBy: "Markus Müller",
	title: "Report 1",
	reportUrl: "http://localhost:3000/admin/reports/abcdefg",
	logoUrl: "http://localhost:3000/assets/zemio-logo-woodmark.png",
};

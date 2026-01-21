import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Text,
} from "@react-email/components";
import type { ReportStatus } from "@/generated/prisma/enums";
import { translateReportStatus } from "@/lib/utils";

const baseUrl =
	process.env.NODE_ENV === "production"
		? "https://spesen.move-ev.de"
		: "http://localhost:3000";

type Attachment = {
	id?: string;
	key: string;
};

interface ExpenseReportReviewerNotificationProps {
	name: string;
	title: string;
	isCreated: boolean;
	status?: ReportStatus;
	reportId: string;
	description: string;
	businessUnit: string;
	accountingUnit: string;
	attachments: Attachment[];
	totalAmount: number;
}

export default function ExpenseReportReviewerNotification({
	name,
	title,
	isCreated,
	status,
	reportId,
	description,
	accountingUnit,
	attachments,
	totalAmount,
}: ExpenseReportReviewerNotificationProps) {
	const previewText = isCreated
		? `Neuer Spesenantrag von ${name}: ${title}`
		: `Spesenantrag "${title}" wurde geändert`;

	return (
		<Html lang="de">
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={logoSection}>
						<Img
							alt="move e.V. logo"
							height={38}
							src="cid:move-logo"
							style={logo}
							width={90}
						/>
					</Section>

					<Section style={badgeSection}>
						<Text style={badge}>
							Spesenantrag <strong>{isCreated ? "erstellt" : "geändert"}</strong>
						</Text>
					</Section>

					<Section style={contentSection}>
						<Text style={greeting}>
							Hallo <span style={{ fontSize: "18px" }}>👋</span>,
						</Text>
						<Text style={messageText}>
							{isCreated ? (
								<>
									<strong>{name}</strong> hat einen neuen Spesenantrag{" "}
									<strong>{title}</strong> erstellt.
								</>
							) : (
								<>
									<strong>{name}</strong> hat den Status des Spesenantrags{" "}
									<strong>{title}</strong> zu{" "}
									<span style={{ color: "#0070f3" }}>
										{status && translateReportStatus(status)}
									</span>{" "}
									geändert.
								</>
							)}
						</Text>
						<Text style={linkText}>
							Du kannst den Antrag{" "}
							<Link href={`${baseUrl}/reports/${reportId}`} style={link}>
								hier einsehen
							</Link>
							.
						</Text>
					</Section>

					<Section style={detailsSection}>
						<Row style={detailRow}>
							<Text style={detailLabel}>Beschreibung:</Text>
							<Text style={detailValue}>{description}</Text>
						</Row>
						<Row style={detailRow}>
							<Text style={detailLabel}>Rechnungseinheit:</Text>
							<Text style={detailValue}>{accountingUnit}</Text>
						</Row>
						<Row style={detailRow}>
							<Text style={detailLabel}>Gesamtausgaben:</Text>
							<Text style={detailValue}>
								{"€ " +
									Number(totalAmount ?? 0).toLocaleString("de-DE", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
							</Text>
						</Row>
					</Section>

					{attachments && attachments.length > 0 && (
						<Section style={attachmentsSection}>
							<Heading as="h3" style={attachmentsHeading}>
								Anhänge
							</Heading>
							{attachments.map((attachment, index) => (
								<Text
									key={attachment.id || attachment.key || index}
									style={attachmentItem}
								>
									<Link
										href={`${baseUrl}/api/attachments/${encodeURIComponent(attachment.key)}`}
										style={attachmentLink}
									>
										{attachment.key}
									</Link>
								</Text>
							))}
						</Section>
					)}

					<Hr style={hr} />

					<Section style={footerSection}>
						<Text style={footerTitle}>
							move - Studentische Unternehmensberatung e.V.
						</Text>
						<Text style={footerAddress}>Universitätsstraße 14, 48143 Münster</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// Styles
const main = {
	fontFamily: "'IBM Plex Sans', Arial, sans-serif",
	background: "#f8fafd",
	color: "#1a1a1a",
	padding: "0",
	margin: "0",
};

const container = {
	maxWidth: "540px",
	margin: "48px auto",
	background: "#fff",
	borderRadius: "10px",
	boxShadow: "0 4px 28px #0001",
	overflow: "hidden" as const,
	border: "1px solid #eee",
};

const logoSection = {
	textAlign: "center" as const,
	padding: "32px 0 8px 0",
};

const logo = {
	display: "inline-block",
	marginBottom: "4px",
};

const badgeSection = {
	textAlign: "center" as const,
	padding: "0 0 18px 0",
};

const badge = {
	display: "inline-block",
	background: "#e8f0fd",
	color: "#1366d6",
	borderRadius: "999px",
	fontWeight: 500,
	fontSize: "14px",
	padding: "6px 18px",
	letterSpacing: ".5px",
	marginBottom: "5px",
	margin: "0",
};

const contentSection = {
	padding: "24px 36px 0 36px",
};

const greeting = {
	fontSize: "17px",
	margin: "0",
};

const messageText = {
	fontSize: "15px",
	margin: "12px 0 0 0",
	lineHeight: "1.55",
};

const linkText = {
	margin: "20px 0 12px 0",
	fontSize: "15px",
};

const link = {
	color: "#0053c2",
	textDecoration: "underline",
};

const detailsSection = {
	padding: "14px 36px 0 36px",
};

const detailRow = {
	marginBottom: "0",
};

const detailLabel = {
	color: "#777",
	padding: "5px 8px 5px 0",
	fontWeight: 500,
	fontSize: "15px",
	margin: "0",
	display: "inline-block",
	width: "140px",
};

const detailValue = {
	padding: "5px 0",
	fontSize: "15px",
	margin: "0",
	display: "inline-block",
};

const attachmentsSection = {
	padding: "16px 36px 0 36px",
};

const attachmentsHeading = {
	fontSize: "14px",
	margin: "0 0 6px 0",
	color: "#889",
	fontWeight: 600,
};

const attachmentItem = {
	margin: "0 0 7px 0",
	fontSize: "14px",
};

const attachmentLink = {
	color: "#1764bb",
	textDecoration: "underline",
	wordBreak: "break-all" as const,
};

const hr = {
	border: "none",
	borderTop: "1px solid #e1e5ea",
	margin: "36px 36px 0 36px",
};

const footerSection = {
	padding: "17px 36px 22px 36px",
	textAlign: "center" as const,
};

const footerTitle = {
	fontWeight: 600,
	fontSize: "15px",
	margin: "0 0 3px 0",
	color: "#555",
};

const footerAddress = {
	fontSize: "14px",
	margin: "0",
	color: "#888",
};

ExpenseReportReviewerNotification.PreviewProps = {
	name: "Lennard Lohmann",
	title: "Baguette Weihnachtsfeier",
	isCreated: false,
	status: "PENDING_APPROVAL",
	reportId: "123",
	description: "Baguette für die Weihnachtsfeier",
	businessUnit: "Ideeller Bereich",
	accountingUnit: "114: ideele Events",
	attachments: [{ key: "invoice-123.pdf" }],
	totalAmount: 6.5,
};

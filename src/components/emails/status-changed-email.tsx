import { Body, Head, Html } from "@react-email/components";
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

interface StatusChangedEmailProps {
	name: string;
	title: string;
	status: ReportStatus;
	reportId: string;
	description: string;
	businessUnit: string;
	accountingUnit: string;
	attachments: Attachment[];
	totalAmount: number;
}

export default function StatusChangedEmail({
	name,
	title,
	status,
	reportId,
	description,
	accountingUnit,
	attachments,
	totalAmount,
}: StatusChangedEmailProps) {
	return (
		<Html lang="de">
			<Head />
			<Body
				style={{
					fontFamily: "'IBM Plex Sans', Arial, sans-serif",
					background: "#f8fafd",
					color: "#1a1a1a",
					padding: "0",
					margin: "0",
				}}
			>
				<table
					cellPadding={0}
					cellSpacing={0}
					style={{
						maxWidth: 540,
						margin: "48px auto",
						background: "#fff",
						borderRadius: "10px",
						boxShadow: "0 4px 28px #0001",
						overflow: "hidden",
						border: "1px solid #eee",
					}}
					width="100%"
				>
					<tbody>
						<tr>
							<td style={{ textAlign: "center", padding: "32px 0 8px 0" }}>
								<img
									alt="move e.V. logo"
									height={38}
									src="cid:move-logo"
									style={{ display: "inline-block", marginBottom: 4 }}
									width={90}
								/>
							</td>
						</tr>
						<tr>
							<td style={{ textAlign: "center", padding: "0 0 18px 0" }}>
								<span
									style={{
										display: "inline-block",
										background: "#e8f0fd",
										color: "#1366d6",
										borderRadius: "999px",
										fontWeight: 500,
										fontSize: "14px",
										padding: "6px 18px",
										letterSpacing: ".5px",
										marginBottom: "5px",
									}}
								>
									Spesenantrag <strong>geändert</strong>
								</span>
							</td>
						</tr>
						<tr>
							<td style={{ padding: "24px 36px 0 36px" }}>
								<p style={{ fontSize: "17px", margin: 0 }}>
									Hallo <span style={{ fontSize: "18px" }}>👋</span>,
								</p>
								<p
									style={{ fontSize: "15px", margin: "12px 0 0 0", lineHeight: "1.55" }}
								>
									<strong>{name}</strong> hat den Status des Spesenantrags{" "}
									<strong>{title}</strong> zu{" "}
									<span style={{ color: "#0070f3" }}>
										{translateReportStatus(status)}
									</span>{" "}
									geändert.
								</p>
								<p style={{ margin: "20px 0 12px 0", fontSize: "15px" }}>
									Du kannst den Antrag&nbsp;
									<a
										href={`${baseUrl}/reports/${reportId}`}
										style={{ color: "#0053c2", textDecoration: "underline" }}
									>
										hier einsehen
									</a>
									.
								</p>
							</td>
						</tr>
						<tr>
							<td style={{ padding: "14px 36px 0 36px" }}>
								<table style={{ width: "100%", fontSize: "15px", borderSpacing: 0 }}>
									<tbody>
										<tr>
											<td
												style={{ color: "#777", padding: "5px 8px 5px 0", fontWeight: 500 }}
											>
												Beschreibung:
											</td>
											<td style={{ padding: "5px 0" }}>{description}</td>
										</tr>
										<tr>
											<td
												style={{ color: "#777", padding: "5px 8px 5px 0", fontWeight: 500 }}
											>
												Rechnungseinheit:
											</td>
											<td style={{ padding: "5px 0" }}>{accountingUnit}</td>
										</tr>
										<tr>
											<td
												style={{ color: "#777", padding: "5px 8px 5px 0", fontWeight: 500 }}
											>
												Gesamtausgaben:
											</td>
											<td style={{ padding: "5px 0" }}>
												{"€ " +
													Number(totalAmount ?? 0).toLocaleString("de-DE", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
											</td>
										</tr>
									</tbody>
								</table>
							</td>
						</tr>
						{attachments && attachments.length > 0 && (
							<tr>
								<td style={{ padding: "16px 36px 0 36px" }}>
									<h3 style={{ fontSize: "14px", margin: "0 0 6px 0", color: "#889" }}>
										Anhänge
									</h3>
									<ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
										{attachments.map((attachment, index) => (
											<li
												key={attachment.id || attachment.key || index}
												style={{ margin: "0 0 7px 0", fontSize: "14px" }}
											>
												<a
													href={`https://spesen.move-ev.de/api/attachments/${attachment.key}`}
													style={{
														color: "#1764bb",
														textDecoration: "underline",
														wordBreak: "break-all",
													}}
												>
													{attachment.key}
												</a>
											</li>
										))}
									</ul>
								</td>
							</tr>
						)}
						{/* Footer Section Begins */}
						<tr>
							<td style={{ padding: "0 36px 0 36px" }}>
								<hr
									style={{
										border: "none",
										borderTop: "1px solid #e1e5ea",
										margin: "36px 0 0 0",
									}}
								/>
							</td>
						</tr>
						<tr>
							<td
								style={{
									padding: "17px 36px 22px 36px",
									color: "#555",
									textAlign: "center",
								}}
							>
								<p style={{ fontWeight: 600, fontSize: "15px", margin: "0 0 3px 0" }}>
									move - Studentische Unternehmensberatung e.V.
								</p>
								<p style={{ fontSize: "14px", margin: 0, color: "#888" }}>
									Universitätsstraße 14, 48143 Münster
								</p>
							</td>
						</tr>
						{/* Footer Section Ends */}
					</tbody>
				</table>
			</Body>
		</Html>
	);
}

StatusChangedEmail.PreviewProps = {
	name: "Lennard Lohmann",
	title: "Baguette Weihnachtsfeier",
	status: "PENDING_APPROVAL",
	reportId: "123",
	description: "Baguette für die Weihnachtsfeier",
	businessUnit: "Ideeller Bereich",
	accountingUnit: "114: ideele Events",
	attachments: [{ key: "invoice-123.pdf" }],
	totalAmount: 6.5,
};

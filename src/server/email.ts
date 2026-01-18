import { env } from "@/env";
import { db } from "@/server/db";

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
	// If no email API key is configured, log to console in development
	if (!env.EMAIL_API_KEY) {
		if (env.NODE_ENV === "development") {
			console.log("📧 Email would be sent:");
			console.log("To:", to);
			console.log("Subject:", subject);
			console.log("HTML:", html);
			return { success: true, message: "Email logged to console" };
		}
		return { success: false, message: "Email not configured" };
	}

	try {
		// Using fetch to send email via Resend API
		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.EMAIL_API_KEY}`,
			},
			body: JSON.stringify({
				from: env.EMAIL_FROM || "noreply@move-ev.de",
				to,
				subject,
				html,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to send email");
		}

		const data = await response.json();
		return { success: true, id: data.id };
	} catch (error) {
		console.error("Email sending error:", error);
		return { success: false, error: String(error) };
	}
}

export async function sendReportSubmittedEmail(reportId: string) {
	const report = await db.report.findUnique({
		where: { id: reportId },
		include: {
			owner: true,
			expenses: true,
		},
	});

	if (!report) {
		return { success: false, message: "Report not found" };
	}

	const settings = await db.settings.findUnique({
		where: { id: "singleton" },
	});

	if (!settings?.reviewerEmail) {
		return { success: false, message: "Reviewer email not configured" };
	}

	const totalAmount = report.expenses.reduce(
		(sum, expense) => sum + Number(expense.amount),
		0,
	);

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
				.content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
				.button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
				.info-row { margin: 10px 0; }
				.label { font-weight: bold; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Neuer Spesenantrag eingereicht</h1>
				</div>
				<div class="content">
					<p>Ein neuer Spesenantrag wurde zur Genehmigung eingereicht:</p>
					
					<div class="info-row">
						<span class="label">Titel:</span> ${report.title}
					</div>
					${report.description ? `
					<div class="info-row">
						<span class="label">Beschreibung:</span> ${report.description}
					</div>
					` : ""}
					<div class="info-row">
						<span class="label">IBAN:</span> ${report.businessUnit}
					</div>
					<div class="info-row">
						<span class="label">Buchungskreis:</span> ${report.accountingUnit}
					</div>
					<div class="info-row">
						<span class="label">Antragsteller:</span> ${report.owner.name} (${report.owner.email})
					</div>
					<div class="info-row">
						<span class="label">Anzahl Ausgaben:</span> ${report.expenses.length}
					</div>
					<div class="info-row">
						<span class="label">Gesamtbetrag:</span> ${totalAmount.toFixed(2)} €
					</div>
					<div class="info-row">
						<span class="label">Erstellt am:</span> ${new Date(report.createdAt).toLocaleDateString("de-DE", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</div>
					
					<p style="margin-top: 30px;">
						<a href="${env.BETTER_AUTH_URL}/reports/${report.id}" class="button">
							Antrag öffnen
						</a>
					</p>
				</div>
			</div>
		</body>
		</html>
	`;

	return sendEmail({
		to: settings.reviewerEmail,
		subject: `Neuer Spesenantrag: ${report.title}`,
		html,
	});
}

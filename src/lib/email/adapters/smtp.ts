// ================================================
// SMTP Email Adapter
// ================================================

import { createTransport } from "nodemailer";
import z from "zod";
import type { EmailAdapter } from "../types/adapter";
import { sendArgsToContent } from "../utils";

const smtpAdapterConfigSchema = z.object({
	host: z.string().min(1),
	port: z.coerce.number().min(1),
	secure: z.coerce.boolean().default(false),
	user: z.string().min(1),
	password: z.string().min(1),
});

export function createSMTPAdapter(): EmailAdapter {
	const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } =
		process.env;

	const validationResult = smtpAdapterConfigSchema.safeParse({
		host: SMTP_HOST,
		port: SMTP_PORT,
		secure: SMTP_SECURE,
		user: SMTP_USER,
		password: SMTP_PASSWORD,
	});

	if (!validationResult.success) {
		throw new Error(
			`Invalid SMTP adapter configuration: ${validationResult.error.message}`,
		);
	}

	const { host, port, secure, user, password } = validationResult.data;

	const transporter = createTransport({
		host,
		port,
		secure,
		auth: {
			user,
			pass: password,
		},
	});

	return {
		async send(args) {
			const { from, to, subject } = args;
			const { html, text } = await sendArgsToContent(args);

			try {
				const info = await transporter.sendMail({
					from,
					to,
					subject,
					html,
					text,
				});

				if (info.rejected.length > 0 || info.accepted.length < to.length) {
					const error =
						info.rejected.length > 0
							? info.rejected.join(", ")
							: "Unknown error occurred while sending email (SMTP Adapter)";

					return {
						ok: false,
						error,
						status: 500,
					};
				}

				return {
					ok: true,
					status: 200,
				};
			} catch (error) {
				// Handle network errors, authentication failures, timeouts, etc.
				const errorMessage =
					error instanceof Error
						? error.message
						: "Unknown error occurred while sending email (SMTP Adapter)";

				return {
					ok: false,
					error: errorMessage,
					status: 500,
				};
			}
		},
	};
}

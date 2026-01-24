import { env } from "@/env";
import { createResendAdapter } from "./adapters/resend";
import { createSMTPAdapter } from "./adapters/smtp";
import type { EmailAdapter } from "./types/adapter";

function createMailer(): EmailAdapter {
	switch (env.MAIL_ADAPTER) {
		case "resend":
			return createResendAdapter();
		case "smtp":
			return createSMTPAdapter();
	}
}

const globalForEmail = globalThis as unknown as {
	email: EmailAdapter | undefined;
};

export const mailer = globalForEmail.email ?? createMailer();

if (env.NODE_ENV !== "production") globalForEmail.email = mailer;

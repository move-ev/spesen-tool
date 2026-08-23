// ================================================
// Scaleway Transactional Email client
// ================================================

import { render } from "@react-email/render";
import type { ReactElement } from "react";

/**
 * Transactional Email is only offered in `fr-par`, so the region is part of the
 * constant rather than configuration.
 */
const ENDPOINT =
	"https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails";

const MAX_ATTEMPTS = 3;

/**
 * A send sits on the request path for invitations, so an unresponsive endpoint
 * has to fail rather than hold the caller open. Node applies no request timeout
 * of its own.
 */
const REQUEST_TIMEOUT_MS = 10_000;

export interface EmailAddress {
	name: string;
	email: string;
}

export interface SendInput {
	from: EmailAddress;
	to: string[];
	subject: string;
	react: ReactElement;
}

export type SendResult =
	| { ok: true; messageIds: string[] }
	| { ok: false; status: number; error: string };

export interface ScalewayClientConfig {
	apiKey: string;
	projectId: string;
	/** Base delay between retries, multiplied by the attempt number. */
	retryDelayMs?: number;
}

export interface ScalewayClient {
	send(input: SendInput): Promise<SendResult>;
}

/**
 * A rate limit or a server-side fault is worth another try. A request that never
 * came back is not: it may have been accepted with only the response lost, and
 * the API takes no idempotency key, so retrying risks a second copy in the inbox.
 */
function isRetryable(status: number): boolean {
	return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Bodies are read as text and parsed here rather than with `response.json()`: a
 * gateway in front of Scaleway can answer either status with something that is
 * not JSON, and that must not surface as a thrown send.
 */
function parseJson(body: string): unknown {
	try {
		return JSON.parse(body);
	} catch {
		return undefined;
	}
}

/** Scaleway describes a rejection in a JSON `message`. */
function errorFrom(body: string): string {
	const parsed = parseJson(body);
	if (
		typeof parsed === "object" &&
		parsed !== null &&
		"message" in parsed &&
		typeof parsed.message === "string"
	) {
		return parsed.message;
	}
	return body.trim();
}

function messageIdsFrom(payload: unknown): string[] {
	if (
		typeof payload !== "object" ||
		payload === null ||
		!("emails" in payload) ||
		!Array.isArray(payload.emails)
	) {
		return [];
	}
	return payload.emails
		.map((entry: unknown) =>
			typeof entry === "object" && entry !== null && "message_id" in entry
				? entry.message_id
				: undefined,
		)
		.filter((id): id is string => typeof id === "string");
}

export function createScalewayClient({
	apiKey,
	projectId,
	retryDelayMs = 250,
}: ScalewayClientConfig): ScalewayClient {
	async function attempt(body: string): Promise<SendResult> {
		let response: Response;
		try {
			response = await fetch(ENDPOINT, {
				method: "POST",
				headers: {
					"X-Auth-Token": apiKey,
					"Content-Type": "application/json",
				},
				body,
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			});
		} catch (cause) {
			// A thrown fetch never reached Scaleway, so there is no status to report.
			return {
				ok: false,
				status: 0,
				error: cause instanceof Error ? cause.message : String(cause),
			};
		}

		if (!response.ok) {
			return {
				ok: false,
				status: response.status,
				error: errorFrom(await response.text()),
			};
		}

		return {
			ok: true,
			messageIds: messageIdsFrom(parseJson(await response.text())),
		};
	}

	return {
		async send({ from, to, subject, react }) {
			// Scaleway takes html and text; a plaintext part is not optional the way
			// it was with a provider that rendered React itself.
			const [html, text] = await Promise.all([
				render(react),
				render(react, { plainText: true }),
			]);

			const body = JSON.stringify({
				project_id: projectId,
				from,
				to: to.map((email) => ({ email })),
				subject,
				html,
				text,
			});

			let result = await attempt(body);
			for (let n = 2; n <= MAX_ATTEMPTS && !result.ok; n++) {
				if (!isRetryable(result.status)) {
					return result;
				}
				await sleep(retryDelayMs * (n - 1));
				result = await attempt(body);
			}
			return result;
		},
	};
}

"use client";

import Appsignal from "@appsignal/javascript";
import { getPublicRuntimeEnv } from "@/lib/runtime-env/public";

let client: Appsignal | undefined;

/**
 * The browser AppSignal client, or undefined when no front-end key is
 * configured (local development, self-hosted instances without AppSignal).
 *
 * Callers must tolerate undefined rather than assume tracking is on.
 */
export function getErrorTracker(): Appsignal | undefined {
	if (client) {
		return client;
	}

	const { appsignalFrontendKey, appsignalRevision } = getPublicRuntimeEnv();
	if (!appsignalFrontendKey) {
		return undefined;
	}

	client = new Appsignal({
		key: appsignalFrontendKey,
		revision: appsignalRevision,
	});
	return client;
}

/**
 * Reports an error, doing nothing when tracking is disabled.
 *
 * Tag values are coerced to strings because AppSignal spans only carry string
 * tags, which lets call sites pass counts and sizes without stringifying at
 * every site.
 */
export function captureError(
	error: unknown,
	tags?: Record<string, string | number | boolean | undefined>,
): void {
	const tracker = getErrorTracker();
	if (!tracker) {
		return;
	}

	const normalized = error instanceof Error ? error : new Error(String(error));
	tracker.sendError(normalized, (span) => {
		if (!tags) {
			return;
		}
		const stringTags: Record<string, string> = {};
		for (const [key, value] of Object.entries(tags)) {
			if (value !== undefined) {
				stringTags[key] = String(value);
			}
		}
		span.setTags(stringTags);
	});
}

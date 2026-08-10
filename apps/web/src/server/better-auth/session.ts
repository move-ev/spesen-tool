import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { auth, type Session } from "./server";

/**
 * Resolves the current session, once per request.
 *
 * `auth.api.getSession` hits the session and user tables on every call and
 * better-auth is configured without a cookie cache, so each nested layout that
 * guarded itself paid for another round trip. React's `cache` collapses those
 * into one lookup per request, which lets every layout keep its own explicit
 * guard.
 *
 * It deliberately takes no arguments: `cache` keys on them, and passing a fresh
 * `Headers` object per call would defeat the deduplication.
 */
export const getCurrentSession = cache(
	async (): Promise<Session | null> =>
		await auth.api.getSession({ headers: await headers() }),
);

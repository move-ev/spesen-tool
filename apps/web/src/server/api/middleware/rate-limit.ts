// biome-ignore-all lint/suspicious/noExplicitAny: Disable linter for now
import { TRPCError } from "@trpc/server";

/**
 * Simple in-memory rate limiter
 * For production, replace with Redis-based implementation (Upstash)
 */
class RateLimiter {
	private requests: Map<string, { count: number; resetAt: number }> = new Map();

	/**
	 * Check if request is within rate limit
	 * @param key - Unique identifier (userId, IP, etc.)
	 * @param maxRequests - Maximum requests allowed
	 * @param windowMs - Time window in milliseconds
	 * @returns true if allowed, false if rate limited
	 */
	check(key: string, maxRequests: number, windowMs: number): boolean {
		const now = Date.now();
		const record = this.requests.get(key);

		// No record or window expired - allow and create new record
		if (!record || now > record.resetAt) {
			this.requests.set(key, {
				count: 1,
				resetAt: now + windowMs,
			});
			return true;
		}

		// Within window - check if under limit
		if (record.count < maxRequests) {
			record.count++;
			return true;
		}

		// Rate limited
		return false;
	}

	/**
	 * Clean up expired entries to prevent memory leak
	 */
	cleanup() {
		const now = Date.now();
		for (const [key, record] of this.requests.entries()) {
			if (now > record.resetAt) {
				this.requests.delete(key);
			}
		}
	}
}

const limiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(
	() => {
		limiter.cleanup();
	},
	5 * 60 * 1000,
);

/**
 * Rate limiting middleware for upload operations
 * Limits: 10 uploads per minute per user
 */
export const uploadRateLimit = ({ ctx, next }: any) => {
	if (!ctx.session?.user?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	const userId = ctx.session.user.id;
	const isAllowed = limiter.check(
		`upload:${userId}`,
		10, // 10 requests
		60 * 1000, // per minute
	);

	if (!isAllowed) {
		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: "Too many upload requests. Please wait a minute and try again.",
		});
	}

	return next();
};

/**
 * Rate limiting for download operations
 * Limits: 100 downloads per minute per user
 */
export const downloadRateLimit = ({ ctx, next }: any) => {
	if (!ctx.session?.user?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	const userId = ctx.session.user.id;
	const isAllowed = limiter.check(
		`download:${userId}`,
		100, // 100 requests
		60 * 1000, // per minute
	);

	if (!isAllowed) {
		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: "Too many download requests. Please slow down.",
		});
	}

	return next();
};

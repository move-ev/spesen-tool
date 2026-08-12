import { TRPCError } from "@trpc/server";

type PrismaKnownError = {
	code: string;
	message?: string;
	meta?: { target?: string[] };
};

function isPrismaKnownError(error: unknown): error is PrismaKnownError {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof (error as { code: unknown }).code === "string"
	);
}

/**
 * True for Prisma `P2002` (unique constraint violation).
 *
 * {@link mapPrismaError} already turns these into a generic `CONFLICT`. Use this
 * only where the domain can state *which* constraint was hit — a service that
 * knows the answer should say so rather than emit the generic message.
 */
export function isUniqueConstraintError(error: unknown): boolean {
	return isPrismaKnownError(error) && error.code === "P2002";
}

/**
 * Prefix of the `P2028` raised when the transaction never opened, as opposed to
 * one that expired part-way through. Matched on the message because Prisma
 * gives both the same code. If the wording ever changes the match simply fails
 * and the error stops being retried, which is the safe direction.
 */
const transactionNeverStarted = "Unable to start a transaction";

/**
 * True for errors that provably committed nothing, so a caller whose
 * transaction body has no external side effects may replay it:
 *
 * - `P2034` — write conflict or deadlock; the database rolled it back.
 * - `P2024` — timed out acquiring a pooled connection; no statement was ever
 *   sent. Unreachable while the app uses the `adapter-pg` driver adapter, whose
 *   pool waits surface as `P2028` instead, but correct if that changes.
 * - `P2028` *only* when the transaction failed to open. Prisma reuses this code
 *   for a transaction that expired mid-flight, which may have expired around
 *   COMMIT — replaying that one could duplicate the write, so it is excluded.
 *
 * Everything else, including the expiring variant of `P2028`, is mapped to a
 * retryable {@link TRPCError} by {@link mapPrismaError} and left for the client
 * to repeat, which is the only layer that knows whether the write already took.
 */
export function isTransientContentionError(error: unknown): boolean {
	if (!isPrismaKnownError(error)) {
		return false;
	}
	switch (error.code) {
		case "P2034":
		case "P2024":
			return true;
		case "P2028":
			return error.message?.includes(transactionNeverStarted) ?? false;
		default:
			return false;
	}
}

/**
 * Maps a thrown error to a typed {@link TRPCError}.
 *
 * - Existing `TRPCError`s pass through unchanged.
 * - Prisma `P2002` (unique constraint) → `CONFLICT`.
 * - Prisma `P2003` (foreign key violation) → `CONFLICT`.
 * - Prisma `P2025` (record not found)   → `NOT_FOUND`.
 * - Prisma `P2024`/`P2028` (contention) → `TIMEOUT`.
 * - Prisma `P2034` (write conflict)     → `CONFLICT`.
 * - Everything else                     → `INTERNAL_SERVER_ERROR`.
 *
 * Use at service/repository boundaries instead of throwing bare `Error`s.
 */
export function mapPrismaError(error: unknown): TRPCError {
	if (error instanceof TRPCError) {
		return error;
	}

	if (isPrismaKnownError(error)) {
		switch (error.code) {
			case "P2002":
				return new TRPCError({
					code: "CONFLICT",
					message: "A resource with these values already exists.",
				});
			case "P2003":
				return new TRPCError({
					code: "CONFLICT",
					message: "This resource is still referenced by other records.",
				});
			case "P2025":
				return new TRPCError({
					code: "NOT_FOUND",
					message: "The requested resource was not found.",
				});
			case "P2024":
			case "P2028":
				return new TRPCError({
					code: "TIMEOUT",
					message: "The server is busy right now. Please try again.",
				});
			case "P2034":
				return new TRPCError({
					code: "CONFLICT",
					message:
						"This record was changed by someone else at the same time. Please try again.",
				});
		}
	}

	return new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: "An unexpected error occurred.",
	});
}

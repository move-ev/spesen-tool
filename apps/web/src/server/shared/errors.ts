import { TRPCError } from "@trpc/server";

type PrismaKnownError = {
	code: string;
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
 * True for Prisma `P2034` (write conflict or deadlock): the database aborted
 * the transaction itself, so nothing was committed and a caller whose
 * transaction body has no external side effects may replay it.
 *
 * Deliberately narrow. `P2024` (pool timeout) and `P2028` (interactive
 * transaction expired) also mean "too busy", but neither says whether the
 * transaction committed — `P2028` is raised for a transaction closed *after*
 * COMMIT was issued too, so replaying one can duplicate the write. Both are
 * mapped to retryable {@link TRPCError}s by {@link mapPrismaError} and left for
 * the caller to retry, which is the only layer that knows the write is safe to
 * repeat.
 */
export function isTransientContentionError(error: unknown): boolean {
	return isPrismaKnownError(error) && error.code === "P2034";
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

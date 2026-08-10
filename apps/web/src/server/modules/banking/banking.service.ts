import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@zemio/db";
import { env } from "@/env";
import { encryptBankingDetails } from "@/lib/banking/cryptic";
import { normalizeIban } from "@/lib/banking/iban";
import { logger } from "@/lib/logger";
import { mapPrismaError } from "@/server/shared/errors";
import {
	type BankingDetailsDTO,
	type BankingListItemDTO,
	toBankingDetailsDTO,
} from "./banking.dto";
import {
	type BankingDetail,
	type BankingRepository,
	bankingRepository,
} from "./banking.repository";
import type {
	BankingDetailsInput,
	IbanValidationResult,
} from "./banking.validators";
import { ibanValidationResultSchema } from "./banking.validators";

export type BankingServiceContext = {
	db: PrismaClient;
	userId: string;
};

/**
 * Asks the internal banking service whether an IBAN is valid and resolves its
 * BIC. Proxied server-side so the service key never reaches the client.
 *
 * A 400 is the documented "IBAN is invalid" response and is a normal result.
 * Anything else means the check could not be performed, which is a real
 * failure: it is logged and thrown rather than reported as "invalid", so an
 * outage never looks identical to a user typo.
 */
async function fetchIbanValidation(
	iban: string,
): Promise<IbanValidationResult> {
	const url = `${env.API_URL}/banking/iban/${encodeURIComponent(iban)}`;

	let response: Response;
	try {
		response = await fetch(url, {
			headers: { "X-Service-Key": env.INTERNAL_API_SECRET },
		});
	} catch (err) {
		logger.error("banking.validate_iban_unreachable", {
			message: err instanceof Error ? err.message : String(err),
		});
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Unable to reach the banking service",
		});
	}

	if (response.status === 400) {
		return { valid: false, bic: null };
	}

	const body: unknown = await response.json().catch(() => null);
	const parsed = ibanValidationResultSchema.safeParse(body);

	if (!response.ok || !parsed.success) {
		logger.error("banking.validate_iban_failed", { status: response.status });
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Unable to validate IBAN",
		});
	}

	return parsed.data;
}

export function createBankingService(deps: { repo: BankingRepository }) {
	const { repo } = deps;

	return {
		validateIban(input: { iban: string }): Promise<IbanValidationResult> {
			return fetchIbanValidation(normalizeIban(input.iban));
		},

		list(ctx: BankingServiceContext): Promise<BankingListItemDTO[]> {
			return repo.listForUser(ctx.db, ctx.userId);
		},

		byId(details: BankingDetail): BankingDetailsDTO {
			return toBankingDetailsDTO(details);
		},

		async create(
			ctx: BankingServiceContext,
			input: BankingDetailsInput,
		): Promise<BankingListItemDTO> {
			const encrypted = await encryptBankingDetails({
				iban: input.iban,
				fullName: input.fullName,
			});

			try {
				return await repo.create(ctx.db, {
					userId: ctx.userId,
					title: input.title,
					encrypted,
				});
			} catch (error) {
				throw mapPrismaError(error);
			}
		},

		async update(
			ctx: BankingServiceContext,
			details: BankingDetail,
			input: BankingDetailsInput,
		): Promise<BankingListItemDTO> {
			const encrypted = await encryptBankingDetails({
				iban: input.iban,
				fullName: input.fullName,
			});

			try {
				return await repo.update(ctx.db, {
					id: details.id,
					title: input.title,
					encrypted,
				});
			} catch (error) {
				throw mapPrismaError(error);
			}
		},

		/**
		 * Deleting is safe for reports that already reference this record: the
		 * submitted values live in an immutable ReportBankingSnapshot, and the
		 * live foreign key is nullable with ON DELETE SET NULL.
		 */
		async remove(
			ctx: BankingServiceContext,
			details: BankingDetail,
		): Promise<BankingListItemDTO> {
			try {
				return await repo.remove(ctx.db, details.id);
			} catch (error) {
				throw mapPrismaError(error);
			}
		},
	};
}

export type BankingService = ReturnType<typeof createBankingService>;

export const bankingService = createBankingService({ repo: bankingRepository });

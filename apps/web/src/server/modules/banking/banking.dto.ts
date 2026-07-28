import { decryptBankingDetails } from "@/lib/banking/cryptic";
import type { BankingDetail, BankingListRow } from "./banking.repository";

/** A row in the banking-details list: no sensitive field ever leaves the server. */
export type BankingListItemDTO = BankingListRow;

/**
 * The decrypted record, for the owner editing it. Built by explicit projection
 * rather than by spreading the row, so an added column can never leak by
 * default — and so the ciphertext is not shipped alongside the plaintext.
 */
export type BankingDetailsDTO = {
	id: string;
	title: string;
	iban: string;
	fullName: string;
	createdAt: Date;
};

export function toBankingDetailsDTO(row: BankingDetail): BankingDetailsDTO {
	const decrypted = decryptBankingDetails(row);
	return {
		id: row.id,
		title: row.title,
		iban: decrypted.iban,
		fullName: decrypted.fullName,
		createdAt: row.createdAt,
	};
}

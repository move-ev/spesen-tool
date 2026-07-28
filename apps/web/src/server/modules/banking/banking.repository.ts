import type { Prisma, PrismaClient } from "@zemio/db";

type Db = PrismaClient;

/**
 * Full row including the encrypted columns. Only the DTO layer may decrypt —
 * nothing here reaches a client unmapped.
 */
const bankingDetailSelect = {
	id: true,
	title: true,
	iban: true,
	fullName: true,
	userId: true,
	createdAt: true,
} satisfies Prisma.BankingDetailsSelect;

/**
 * List projection. The IBAN and holder name are deliberately absent: they are
 * encrypted per-field, and shipping every record's ciphertext to the client so
 * it can render a list of titles would widen the blast radius for nothing.
 */
const bankingListSelect = {
	id: true,
	title: true,
	createdAt: true,
} satisfies Prisma.BankingDetailsSelect;

export type BankingDetail = Prisma.BankingDetailsGetPayload<{
	select: typeof bankingDetailSelect;
}>;

export type BankingListRow = Prisma.BankingDetailsGetPayload<{
	select: typeof bankingListSelect;
}>;

type EncryptedFields = { iban: string; fullName: string };

export const bankingRepository = {
	findById(db: Db, id: string): Promise<BankingDetail | null> {
		return db.bankingDetails.findUnique({
			where: { id },
			select: bankingDetailSelect,
		});
	},

	listForUser(db: Db, userId: string): Promise<BankingListRow[]> {
		return db.bankingDetails.findMany({
			where: { userId },
			select: bankingListSelect,
			orderBy: { createdAt: "asc" },
		});
	},

	create(
		db: Db,
		args: { userId: string; title: string; encrypted: EncryptedFields },
	): Promise<BankingListRow> {
		return db.bankingDetails.create({
			data: {
				title: args.title,
				userId: args.userId,
				...args.encrypted,
			},
			select: bankingListSelect,
		});
	},

	update(
		db: Db,
		args: { id: string; title: string; encrypted: EncryptedFields },
	): Promise<BankingListRow> {
		return db.bankingDetails.update({
			where: { id: args.id },
			data: { title: args.title, ...args.encrypted },
			select: bankingListSelect,
		});
	},

	remove(db: Db, id: string): Promise<BankingListRow> {
		return db.bankingDetails.delete({
			where: { id },
			select: bankingListSelect,
		});
	},
} as const;

export type BankingRepository = typeof bankingRepository;

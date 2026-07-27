import type { Prisma, PrismaClient } from "@zemio/db";

type Db = PrismaClient;

const attachmentDetailSelect = {
	id: true,
	key: true,
	size: true,
	originalName: true,
	expenseId: true,
	createdAt: true,
	updatedAt: true,
	expense: {
		select: {
			report: {
				select: {
					ownerId: true,
					organizationId: true,
					status: true,
				},
			},
		},
	},
} satisfies Prisma.AttachmentSelect;

/**
 * List projection. Deliberately omits `key`: the storage object key is only
 * ever needed server-side to presign a URL, and shipping it to the browser
 * hands out a durable pointer into the bucket for no rendering benefit.
 * Mirrors the projection the review detail already uses.
 */
const attachmentListSelect = {
	id: true,
	size: true,
	originalName: true,
	createdAt: true,
	updatedAt: true,
	expenseId: true,
} satisfies Prisma.AttachmentSelect;

export type AttachmentDetail = Prisma.AttachmentGetPayload<{
	select: typeof attachmentDetailSelect;
}>;

export type AttachmentListRow = Prisma.AttachmentGetPayload<{
	select: typeof attachmentListSelect;
}>;

export const attachmentRepository = {
	findById(db: Db, id: string): Promise<AttachmentDetail | null> {
		return db.attachment.findUnique({
			where: { id },
			select: attachmentDetailSelect,
		});
	},

	listForExpense(db: Db, expenseId: string): Promise<AttachmentListRow[]> {
		return db.attachment.findMany({
			where: { expenseId },
			select: attachmentListSelect,
		});
	},

	listForReport(db: Db, reportId: string): Promise<AttachmentListRow[]> {
		return db.attachment.findMany({
			where: { expense: { reportId } },
			select: attachmentListSelect,
		});
	},

	findManyByIds(db: Db, args: { ids: string[]; organizationId: string }) {
		return db.attachment.findMany({
			where: {
				id: { in: args.ids },
				expense: { report: { organizationId: args.organizationId } },
			},
			select: { id: true, key: true, originalName: true },
		});
	},

	countForExpense(db: Db, expenseId: string): Promise<number> {
		return db.attachment.count({ where: { expenseId } });
	},

	createMany(
		db: Db,
		data: Array<{
			expenseId: string;
			key: string;
			size: bigint | number;
			originalName: string;
		}>,
	): Promise<Array<{ id: string; originalName: string; expenseId: string }>> {
		return Promise.all(
			data.map((item) =>
				db.attachment.create({
					data: item,
					select: { id: true, originalName: true, expenseId: true },
				}),
			),
		);
	},

	remove(db: Db, id: string) {
		return db.attachment.delete({ where: { id }, select: { id: true } });
	},
} as const;

export type AttachmentRepository = typeof attachmentRepository;

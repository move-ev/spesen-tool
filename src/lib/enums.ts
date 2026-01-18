// Client-safe enum definitions (matching Prisma schema)
// These can be used in client components without importing Prisma

export const ReportStatus = {
	DRAFT: "DRAFT",
	PENDING_APPROVAL: "PENDING_APPROVAL",
	NEEDS_REVISION: "NEEDS_REVISION",
	ACCEPTED: "ACCEPTED",
	REJECTED: "REJECTED",
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ExpenseType = {
	RECEIPT: "RECEIPT",
	TRAVEL: "TRAVEL",
	FOOD: "FOOD",
} as const;

export type ExpenseType = (typeof ExpenseType)[keyof typeof ExpenseType];

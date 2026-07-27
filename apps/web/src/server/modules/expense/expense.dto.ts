import type { ExpenseType, Prisma } from "@zemio/db";
import { decimalToNumber } from "@/server/shared/money";
import type { ExpenseDetail, ExpenseListItem } from "./expense.repository";

export type TravelExpenseDetailDTO = {
	from: string;
	to: string;
	distance: number;
};

export type FoodExpenseDetailDTO = {
	days: number;
	breakfastDeduction: number;
	lunchDeduction: number;
	dinnerDeduction: number;
};

export function toTravelExpenseDetailDTO(
	detail: { from: string; to: string; distance: Prisma.Decimal } | null,
): TravelExpenseDetailDTO | null {
	if (!detail) {
		return null;
	}
	return {
		from: detail.from,
		to: detail.to,
		distance: decimalToNumber(detail.distance),
	};
}

export function toFoodExpenseDetailDTO(
	detail: {
		days: number;
		breakfastDeduction: Prisma.Decimal;
		lunchDeduction: Prisma.Decimal;
		dinnerDeduction: Prisma.Decimal;
	} | null,
): FoodExpenseDetailDTO | null {
	if (!detail) {
		return null;
	}
	return {
		days: detail.days,
		breakfastDeduction: decimalToNumber(detail.breakfastDeduction),
		lunchDeduction: decimalToNumber(detail.lunchDeduction),
		dinnerDeduction: decimalToNumber(detail.dinnerDeduction),
	};
}

export type ExpenseByIdDTO = {
	id: string;
	reportId: string;
	type: ExpenseType;
	amount: number;
	description: string | null;
	startDate: Date;
	endDate: Date;
	travelDetail: TravelExpenseDetailDTO | null;
	foodDetail: FoodExpenseDetailDTO | null;
};

export function toExpenseByIdDTO(expense: ExpenseDetail): ExpenseByIdDTO {
	return {
		id: expense.id,
		reportId: expense.reportId,
		type: expense.type,
		amount: decimalToNumber(expense.amount),
		description: expense.description,
		startDate: expense.startDate,
		endDate: expense.endDate,
		travelDetail: toTravelExpenseDetailDTO(expense.travelDetail),
		foodDetail: toFoodExpenseDetailDTO(expense.foodDetail),
	};
}

export type AttachmentListItemDTO = {
	id: string;
	expenseId: string;
	key: string;
	size: number;
	originalName: string;
	createdAt: Date;
	updatedAt: Date;
};

function toAttachmentListItemDTO(
	attachment: ExpenseListItem["attachments"][number],
): AttachmentListItemDTO {
	return {
		id: attachment.id,
		expenseId: attachment.expenseId,
		key: attachment.key,
		size: Number(attachment.size),
		originalName: attachment.originalName,
		createdAt: attachment.createdAt,
		updatedAt: attachment.updatedAt,
	};
}

export type ExpenseListItemDTO = {
	id: string;
	reportId: string;
	type: ExpenseType;
	amount: number;
	description: string | null;
	startDate: Date;
	endDate: Date;
	travelDetail: TravelExpenseDetailDTO | null;
	foodDetail: FoodExpenseDetailDTO | null;
	attachments: AttachmentListItemDTO[];
};

export function toExpenseListItemDTO(
	expense: ExpenseListItem,
): ExpenseListItemDTO {
	return {
		id: expense.id,
		reportId: expense.reportId,
		type: expense.type,
		amount: decimalToNumber(expense.amount),
		description: expense.description,
		startDate: expense.startDate,
		endDate: expense.endDate,
		travelDetail: toTravelExpenseDetailDTO(expense.travelDetail),
		foodDetail: toFoodExpenseDetailDTO(expense.foodDetail),
		attachments: expense.attachments.map(toAttachmentListItemDTO),
	};
}

import { decimalToNumber } from "@/server/shared/money";
import type { SettingsRow } from "./settings.repository";

/**
 * Org settings with every monetary column converted once, here. Routers and
 * components never see a Decimal, so `Number(...)` cannot reappear at a call
 * site (docs/trpc-architecture.md, "DTOs + Decimal once").
 */
export type SettingsDTO = {
	id: string;
	organizationId: string;
	kilometerRate: number;
	reviewerEmail: string | null;
	costUnitInfoUrl: string | null;
	dailyFoodAllowance: number;
	breakfastDeduction: number;
	lunchDeduction: number;
	dinnerDeduction: number;
	createdAt: Date;
	updatedAt: Date;
};

export function toSettingsDTO(row: SettingsRow): SettingsDTO {
	return {
		id: row.id,
		organizationId: row.organizationId,
		kilometerRate: decimalToNumber(row.kilometerRate),
		reviewerEmail: row.reviewerEmail,
		costUnitInfoUrl: row.costUnitInfoUrl,
		dailyFoodAllowance: decimalToNumber(row.dailyFoodAllowance),
		breakfastDeduction: decimalToNumber(row.breakfastDeduction),
		lunchDeduction: decimalToNumber(row.lunchDeduction),
		dinnerDeduction: decimalToNumber(row.dinnerDeduction),
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

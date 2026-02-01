import { startOfDay, subDays, subMonths, subWeeks, subYears } from "date-fns";
import type { PrismaClient } from "@/generated/prisma/client";

export enum Period {
	DAY = "day",
	WEEK = "week",
	MONTH = "month",
	YEAR = "year",
}

interface GetAdminStatsOptions {
	organizationId: string;
	period: Period;
}

interface StatsResult {
	current: number;
	previous: number;
	change: number;
}

function buildPeriodWhereClause(period: Period) {
	const now = new Date();
	const endDate = startOfDay(now);

	let startDate: Date;
	switch (period) {
		case Period.DAY:
			startDate = subDays(endDate, 1);
			break;
		case Period.WEEK:
			startDate = subWeeks(endDate, 1);
			break;
		case Period.MONTH:
			startDate = subMonths(endDate, 1);
			break;
		case Period.YEAR:
			startDate = subYears(endDate, 1);
			break;
	}

	let prevStartDate: Date;
	switch (period) {
		case Period.DAY:
			prevStartDate = subDays(startDate, 1);
			break;
		case Period.WEEK:
			prevStartDate = subWeeks(startDate, 1);
			break;
		case Period.MONTH:
			prevStartDate = subMonths(startDate, 1);
			break;
		case Period.YEAR:
			prevStartDate = subYears(startDate, 1);
			break;
	}

	return {
		current: {
			gte: startDate,
			lt: endDate,
		},
		previous: {
			gte: prevStartDate,
			lt: startDate,
		},
	};
}

/**
 * Returns the relative change from previous to current as a decimal (e.g. 0.5 = 50% increase).
 * Handles division by zero when previous is 0.
 * Returns 999 for "new data" cases where previous was 0 but current exists.
 */
function calculateChange(current: number, previous: number): number {
	if (previous === 0) {
		if (current === 0) return 0;
		return 999;
	}
	const change = (current - previous) / previous;
	return Number.isNaN(change) ? 0 : change;
}

/**
 * Calculates the amount of reports created in a given period.
 */
export async function getReportsCreatedStats(
	db: PrismaClient,
	options: GetAdminStatsOptions,
): Promise<StatsResult> {
	try {
		const { organizationId, period } = options;

		const periodWhereClause = buildPeriodWhereClause(period);

		const res = await db.$transaction([
			db.report.count({
				where: {
					createdAt: {
						...periodWhereClause.current,
					},
					organizationId,
				},
			}),
			db.report.count({
				where: {
					createdAt: {
						...periodWhereClause.previous,
					},
					organizationId,
				},
			}),
		]);

		const [reportsCreatedCurrent, reportsCreatedPrevious] = res;

		return {
			current: reportsCreatedCurrent,
			previous: reportsCreatedPrevious,
			change: calculateChange(reportsCreatedCurrent, reportsCreatedPrevious),
		};
	} catch (error) {
		console.error("[getReportsCreatedStats] Database error:", error);
		throw new Error("Failed to fetch reports created statistics");
	}
}

/**
 * Calculates the amount of money requested through reports in a given period.
 */
export async function getAmountRequestedStats(
	db: PrismaClient,
	options: GetAdminStatsOptions,
): Promise<StatsResult> {
	try {
		const { organizationId, period } = options;

		const periodWhereClause = buildPeriodWhereClause(period);

		const res = await db.$transaction([
			db.expense.aggregate({
				_sum: {
					amount: true,
				},
				where: {
					report: {
						AND: [
							{
								createdAt: {
									...periodWhereClause.current,
								},
								organizationId,
							},
						],
					},
				},
			}),
			db.expense.aggregate({
				_sum: {
					amount: true,
				},
				where: {
					report: {
						AND: [
							{
								createdAt: {
									...periodWhereClause.previous,
								},
								organizationId,
							},
						],
					},
				},
			}),
		]);

		const amountRequestedCurrent = Number(res[0]._sum.amount ?? 0);
		const amountRequestedPrevious = Number(res[1]._sum.amount ?? 0);

		return {
			current: amountRequestedCurrent,
			previous: amountRequestedPrevious,
			change: calculateChange(amountRequestedCurrent, amountRequestedPrevious),
		};
	} catch (error) {
		console.error("[getAmountRequestedStats] Database error:", error);
		throw new Error("Failed to fetch amount requested statistics");
	}
}

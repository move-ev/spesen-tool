import { TRPCError } from "@trpc/server";
import {
	ExpenseType,
	type Prisma,
	type PrismaClient,
	ReportStatus,
} from "@zemio/db";
import type { z } from "zod";
import type {
	createFoodExpenseSchema,
	createReceiptExpenseSchema,
	createTravelExpenseSchema,
} from "@/lib/validators";
import { type AuditRepository, auditRepository } from "@/server/modules/audit";
import { mapPrismaError } from "@/server/shared/errors";
import { decimalToNumber } from "@/server/shared/money";
import { deleteFilesFromStorage } from "@/server/storage";
import {
	type ExpenseByIdDTO,
	type ExpenseListItemDTO,
	toExpenseByIdDTO,
	toExpenseListItemDTO,
} from "./expense.dto";
import { type ExpensePolicyContext, expensePolicy } from "./expense.policy";
import {
	type ExpenseDetail,
	type ExpenseRepository,
	expenseRepository,
} from "./expense.repository";

async function runWrite<T>(operation: () => Promise<T>): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		throw mapPrismaError(error);
	}
}

async function transact<T>(
	db: PrismaClient,
	fn: (db: PrismaClient) => Promise<T>,
): Promise<T> {
	try {
		return await db.$transaction((tx) => fn(tx as unknown as PrismaClient));
	} catch (error) {
		throw mapPrismaError(error);
	}
}

export type ExpenseServiceContext = {
	db: PrismaClient;
	organizationId: string;
	userId: string;
	isOrgAdmin: boolean;
};

type CreateReceiptInput = z.infer<typeof createReceiptExpenseSchema>;
type CreateTravelInput = z.infer<typeof createTravelExpenseSchema>;
type CreateFoodInput = z.infer<typeof createFoodExpenseSchema>;

type UpdateExpenseInput = {
	description?: string;
	amount?: number;
	startDate?: Date;
	endDate?: Date;
	from?: string;
	to?: string;
	distance?: number;
	days?: number;
	breakfastDeduction?: number;
	lunchDeduction?: number;
	dinnerDeduction?: number;
};

export function createExpenseService(deps: {
	repo: ExpenseRepository;
	audit: AuditRepository;
}) {
	const { repo, audit } = deps;

	function toPolicyContext(ctx: ExpenseServiceContext): ExpensePolicyContext {
		return { userId: ctx.userId, isOrgAdmin: ctx.isOrgAdmin };
	}

	async function loadReport(ctx: ExpenseServiceContext, reportId: string) {
		const report = await repo.findReport(ctx.db, {
			id: reportId,
			organizationId: ctx.organizationId,
		});
		if (!report) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
		}
		return report;
	}

	function assertOwner(
		ctx: ExpenseServiceContext,
		report: { ownerId: string },
	): void {
		if (report.ownerId !== ctx.userId) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You don't have permission to modify this report's expenses",
			});
		}
	}

	function assertEditable(report: { status: ReportStatus }): void {
		if (
			report.status !== ReportStatus.DRAFT &&
			report.status !== ReportStatus.NEEDS_REVISION
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "You can only add expenses to draft or needs revision reports",
			});
		}
	}

	return {
		async list(
			ctx: ExpenseServiceContext,
			input: { reportId: string },
		): Promise<ExpenseListItemDTO[]> {
			const report = await loadReport(ctx, input.reportId);
			expensePolicy.authorize("read", toPolicyContext(ctx), { report });
			const expenses = await repo.listForReport(ctx.db, input.reportId);
			return expenses.map(toExpenseListItemDTO);
		},

		byId(expense: ExpenseDetail): ExpenseByIdDTO {
			return toExpenseByIdDTO(expense);
		},

		async createReceipt(
			ctx: ExpenseServiceContext,
			input: CreateReceiptInput,
		): Promise<{ id: string }> {
			const report = await loadReport(ctx, input.reportId);
			assertOwner(ctx, report);
			assertEditable(report);

			const expectedKeyPrefix = `attachment/${ctx.organizationId}/`;
			const hasInvalidKey = input.attachments.some(
				(a) => !a.key.startsWith(expectedKeyPrefix),
			);
			if (hasInvalidKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "One or more attachment keys do not belong to this organization",
				});
			}

			return transact(ctx.db, async (db) => {
				const result = await repo.create(db, {
					report: { connect: { id: input.reportId } },
					type: ExpenseType.RECEIPT,
					amount: input.amount,
					startDate: input.startDate,
					endDate: input.endDate,
					description: input.description,
					attachments: {
						createMany: {
							data: input.attachments.map((a) => ({
								key: a.key,
								size: a.size,
								originalName: a.originalName,
							})),
						},
					},
				});
				await audit.append(db, {
					organizationId: ctx.organizationId,
					actorId: ctx.userId,
					entityType: "expense",
					entityId: result.id,
					action: "expense.added",
					diff: null,
					payload: { type: "RECEIPT", reportId: input.reportId },
				});
				return result;
			});
		},

		async createTravel(
			ctx: ExpenseServiceContext,
			input: CreateTravelInput,
		): Promise<{ id: string }> {
			const report = await loadReport(ctx, input.reportId);
			assertOwner(ctx, report);
			assertEditable(report);

			const settings = await repo.findSettings(ctx.db, ctx.organizationId);
			if (!settings) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "App settings have not been set up correctly",
				});
			}

			return transact(ctx.db, async (db) => {
				const result = await repo.create(db, {
					report: { connect: { id: input.reportId } },
					type: ExpenseType.TRAVEL,
					amount: Number(input.distance) * Number(settings.kilometerRate),
					startDate: input.startDate,
					endDate: input.endDate,
					description: input.description,
					travelDetail: {
						create: {
							from: input.from,
							to: input.to,
							distance: input.distance,
						},
					},
				});
				await audit.append(db, {
					organizationId: ctx.organizationId,
					actorId: ctx.userId,
					entityType: "expense",
					entityId: result.id,
					action: "expense.added",
					diff: null,
					payload: { type: "TRAVEL", reportId: input.reportId },
				});
				return result;
			});
		},

		async createFood(
			ctx: ExpenseServiceContext,
			input: CreateFoodInput,
		): Promise<{ id: string }> {
			const report = await loadReport(ctx, input.reportId);
			assertOwner(ctx, report);
			assertEditable(report);

			return transact(ctx.db, async (db) => {
				const result = await repo.create(db, {
					report: { connect: { id: input.reportId } },
					type: ExpenseType.FOOD,
					amount: input.amount,
					startDate: input.startDate,
					endDate: input.endDate,
					description: input.description,
					foodDetail: {
						create: {
							days: input.days,
							breakfastDeduction: input.breakfastDeduction,
							lunchDeduction: input.lunchDeduction,
							dinnerDeduction: input.dinnerDeduction,
						},
					},
				});
				await audit.append(db, {
					organizationId: ctx.organizationId,
					actorId: ctx.userId,
					entityType: "expense",
					entityId: result.id,
					action: "expense.added",
					diff: null,
					payload: { type: "FOOD", reportId: input.reportId },
				});
				return result;
			});
		},

		async update(
			ctx: ExpenseServiceContext,
			expense: ExpenseDetail,
			input: UpdateExpenseInput,
		): Promise<{ id: string }> {
			const {
				from,
				to,
				distance,
				days,
				breakfastDeduction,
				lunchDeduction,
				dinnerDeduction,
				...baseData
			} = input;

			const updateData: Prisma.ExpenseUpdateInput = { ...baseData };

			const before: Record<string, Prisma.InputJsonValue | null> = {};
			const after: Record<string, Prisma.InputJsonValue | null> = {};

			if (expense.type === ExpenseType.TRAVEL) {
				if (from !== undefined || to !== undefined || distance !== undefined) {
					const current = expense.travelDetail;
					const next = {
						from: from ?? current?.from ?? "",
						to: to ?? current?.to ?? "",
						distance: distance ?? (current ? decimalToNumber(current.distance) : 0),
					};
					// Upsert covers legacy rows whose detail row has not been
					// backfilled yet (created during the migration deploy window).
					updateData.travelDetail = { upsert: { create: next, update: next } };
					before.travelDetail = current
						? {
								from: current.from,
								to: current.to,
								distance: decimalToNumber(current.distance),
							}
						: null;
					after.travelDetail = next;
				}

				if (distance !== undefined) {
					const settings = await repo.findSettings(ctx.db, ctx.organizationId);
					const kilometerRate = settings?.kilometerRate ?? 0.3;
					updateData.amount = Number(distance) * Number(kilometerRate);
				}
			}

			if (expense.type === ExpenseType.FOOD) {
				if (
					days !== undefined ||
					breakfastDeduction !== undefined ||
					lunchDeduction !== undefined ||
					dinnerDeduction !== undefined
				) {
					const current = expense.foodDetail;
					const next = {
						days: days ?? current?.days ?? 1,
						breakfastDeduction:
							breakfastDeduction ??
							(current ? decimalToNumber(current.breakfastDeduction) : 0),
						lunchDeduction:
							lunchDeduction ??
							(current ? decimalToNumber(current.lunchDeduction) : 0),
						dinnerDeduction:
							dinnerDeduction ??
							(current ? decimalToNumber(current.dinnerDeduction) : 0),
					};
					updateData.foodDetail = { upsert: { create: next, update: next } };
					before.foodDetail = current
						? {
								days: current.days,
								breakfastDeduction: decimalToNumber(current.breakfastDeduction),
								lunchDeduction: decimalToNumber(current.lunchDeduction),
								dinnerDeduction: decimalToNumber(current.dinnerDeduction),
							}
						: null;
					after.foodDetail = next;
				}
			}

			if (
				"description" in updateData &&
				updateData.description !== expense.description
			) {
				before.description = expense.description;
				after.description = updateData.description as string;
			}
			if ("amount" in updateData) {
				const prevAmount = Number(expense.amount);
				const nextAmount = Number(updateData.amount);
				if (prevAmount !== nextAmount) {
					before.amount = prevAmount;
					after.amount = nextAmount;
				}
			}

			if (Object.keys(before).length === 0) {
				return runWrite(() =>
					repo.update(ctx.db, { id: expense.id, data: updateData }),
				);
			}

			return transact(ctx.db, async (db) => {
				const result = await repo.update(db, { id: expense.id, data: updateData });
				await audit.append(db, {
					organizationId: ctx.organizationId,
					actorId: ctx.userId,
					entityType: "expense",
					entityId: expense.id,
					action: "expense.updated",
					diff: { before, after },
					payload: null,
				});
				return result;
			});
		},

		async remove(
			ctx: ExpenseServiceContext,
			expense: ExpenseDetail,
		): Promise<{ id: string }> {
			const keys = await repo.findAttachmentKeys(ctx.db, expense.id);
			if (keys.length > 0) {
				await deleteFilesFromStorage(keys);
			}
			return transact(ctx.db, async (db) => {
				const result = await repo.remove(db, expense.id);
				await audit.append(db, {
					organizationId: ctx.organizationId,
					actorId: ctx.userId,
					entityType: "expense",
					entityId: expense.id,
					action: "expense.deleted",
					diff: {
						before: {
							type: expense.type,
							amount: Number(expense.amount),
							description: expense.description ?? null,
						},
						after: null,
					},
					payload: null,
				});
				return result;
			});
		},
	};
}

export type ExpenseService = ReturnType<typeof createExpenseService>;

export const expenseService = createExpenseService({
	repo: expenseRepository,
	audit: auditRepository,
});

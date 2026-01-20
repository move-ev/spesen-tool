import { TRPCError } from "@trpc/server";
import { z } from "zod";
import StatusChangedEmail from "@/components/emails/status-changed-email";
import { ReportStatus } from "@/generated/prisma/enums";
import { DEFAULT_EMAIL_FROM } from "@/lib/consts";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";
import { generatePdfSummary } from "@/server/pdf/summary";
import { resend } from "@/server/resend";

export const reportRouter = createTRPCRouter({
	// Get all reports for the current user
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const reports = await ctx.db.report.findMany({
			where: {
				ownerId: ctx.session.user.id,
			},
			include: {
				expenses: true,
				owner: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return reports.map((report) => ({
			...report,
			expenses: report.expenses.map((expense) => ({
				...expense,
				amount: Number(expense.amount),
			})),
		}));
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const report = await ctx.db.report.findUnique({
				where: {
					id: input.id,
				},
				include: {
					owner: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			const isAdmin = ctx.session.user.role === "admin";
			if (!isAdmin && report?.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this report",
				});
			}

			return report;
		}),
	getStats: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const report = await ctx.db.report.findUnique({
				where: {
					id: input.id,
				},
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			const isAdmin = ctx.session.user.role === "admin";
			if (!isAdmin && report?.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this report",
				});
			}

			const [totalAmount, expenseCount] = await ctx.db.$transaction([
				ctx.db.expense.aggregate({
					_sum: {
						amount: true,
					},
				}),
				ctx.db.expense.count({
					where: {
						reportId: input.id,
					},
				}),
			]);

			return {
				totalAmount: totalAmount._sum.amount ? Number(totalAmount._sum.amount) : 0,
				expenseCount: expenseCount,
			};
		}),

	// Get a single report by ID
	getByIdDepr: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const report = await ctx.db.report.findUnique({
				where: {
					id: input.id,
				},
				include: {
					expenses: true,
					owner: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			const isAdmin = ctx.session.user.role === "admin";

			// Check if user owns the report
			if (report.ownerId !== ctx.session.user.id && !isAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this report",
				});
			}

			return report;
		}),

	// Create a new report
	create: protectedProcedure
		.input(
			z.object({
				title: z.string().min(1),
				description: z.string().optional(),
				businessUnit: z.string().min(1),
				accountingUnit: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.report.create({
				data: {
					...input,
					ownerId: ctx.session.user.id,
					status: ReportStatus.DRAFT,
				},
				include: {
					expenses: true,
				},
			});
		}),

	// Update a report
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).optional(),
				description: z.string().optional(),
				businessUnit: z.string().min(1).optional(),
				accountingUnit: z.string().min(1).optional(),
				status: z.nativeEnum(ReportStatus).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Check if user owns the report
			const report = await ctx.db.report.findUnique({
				where: { id },
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			if (report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to update this report",
				});
			}

			return ctx.db.report.update({
				where: { id },
				data,
				include: {
					expenses: true,
				},
			});
		}),

	// Delete a report
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const report = await ctx.db.report.findUnique({
				where: { id: input.id },
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			if (report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to delete this report",
				});
			}

			return ctx.db.report.delete({
				where: { id: input.id },
			});
		}),
	/**
	 * This procedure is only intended for admin use. To set the status of a report from
	 * draft to pending approval, use the submit procedure
	 */
	updateStatus: adminProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(ReportStatus),
				notify: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db.report.update({
				where: { id: input.id },
				data: { status: input.status },
				select: {
					id: true,
					title: true,
					owner: {
						select: {
							email: true,
							name: true,
						},
					},
				},
			});

			if (!result) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update report status",
				});
			}

			if (!input.notify) {
				return result;
			}

			const { error } = await resend.emails.send({
				from: DEFAULT_EMAIL_FROM,
				to: [result.owner.email],
				subject: "Report status changed",
				react: (
					<StatusChangedEmail
						name={result.owner.name}
						reportId={result.id}
						status={input.status}
						title={result.title}
					/>
				),
			});

			if (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to send email",
				});
			}

			return result;
		}),

	/**
	 * This procedure is only intended for the owner of the report to submit it when ready. Only allowed
	 * when status is draft or needs revision. When submitted, the status is set to pending approval.
	 *
	 * For force setting the status to pending approval, use the updateStatus procedure.
	 */
	submit: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const report = await ctx.db.report.findUnique({
				where: {
					id: input.id,
				},
				select: {
					ownerId: true,
					status: true,
				},
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			// Only the owner of the report can submit it
			if (report.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to submit this report",
				});
			}

			// Only allowed when status is draft or needs revision
			const { status } = report;
			if (
				status !== ReportStatus.DRAFT &&
				status !== ReportStatus.NEEDS_REVISION
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Report is not available for submission.`,
				});
			}

			// Update the status to pending approval
			return ctx.db.report.update({
				where: { id: input.id },
				data: { status: ReportStatus.PENDING_APPROVAL },
			});
		}),
	createSummaryPdf: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const report = await ctx.db.report.findUnique({
				where: { id: input.id },
				include: {
					owner: true,
					expenses: true,
				},
			});

			if (!report) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			// TODO: Get reviewer from database
			const summaryPdf = await generatePdfSummary({
				report,
				reviewer: {
					id: ctx.session.user.id,
					name: ctx.session.user.name,
					email: ctx.session.user.email,
					admin: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					emailVerified: false,
					image: null,
					role: "user",
					banReason: null,
					banned: false,
					banExpires: null,
				},
			});

			// Convert buffer to base64 string for transmission
			const base64Pdf = summaryPdf.toString("base64");

			return {
				pdf: base64Pdf,
				filename: `${report.title.replace(/[^a-z0-9]/gi, "_")}_Zusammenfassung.pdf`,
			};
		}),
});

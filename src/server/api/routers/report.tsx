import { TRPCError } from "@trpc/server";
import { z } from "zod";
import CreatorEmail from "@/components/emails/creator-email";
import StatusChangedEmail from "@/components/emails/reviewer-email";
import { ReportStatus } from "@/generated/prisma/enums";
import { DEFAULT_EMAIL_FROM } from "@/lib/consts";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";
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
			// Create the report
			const report = await ctx.db.report.create({
				data: {
					...input,
					ownerId: ctx.session.user.id,
					status: ReportStatus.DRAFT,
				},
				include: {
					expenses: {
						include: {
							attachments: true,
						},
					},
					owner: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			// Calculate total amount and collect attachments
			const totalAmount = report.expenses.reduce(
				(sum, expense) => sum + Number(expense.amount),
				0,
			);
			const attachments = report.expenses.flatMap((expense) =>
				expense.attachments.map((attachment) => ({
					id: attachment.id,
					key: attachment.key,
				})),
			);

			// Get settings to find reviewer email
			const settings = await ctx.db.settings.findUnique({
				where: { id: "singleton" },
				select: {
					reviewerEmail: true,
				},
			});

			// Send email to creator (non-blocking)
			if (report.owner.email) {
				resend.emails
					.send({
						from: DEFAULT_EMAIL_FROM,
						to: [report.owner.email],
						subject: "Spesenantrag erstellt",
						react: (
							<CreatorEmail
								accountingUnit={report.accountingUnit}
								attachments={attachments}
								businessUnit={report.businessUnit}
								description={report.description ?? ""}
								isCreated={true}
								reportId={report.id}
								title={report.title}
								totalAmount={totalAmount}
							/>
						),
					})
					.catch((error) => {
						console.error("Failed to send creator email:", error);
					});
			}

			// Send email to reviewer if configured (non-blocking)
			if (settings?.reviewerEmail) {
				resend.emails
					.send({
						from: DEFAULT_EMAIL_FROM,
						to: [settings.reviewerEmail],
						subject: "Neuer Spesenantrag erstellt",
						react: (
							<StatusChangedEmail
								accountingUnit={report.accountingUnit}
								attachments={attachments}
								businessUnit={report.businessUnit}
								description={report.description ?? ""}
								isCreated={true}
								name={report.owner.name ?? "Unbekannt"}
								reportId={report.id}
								title={report.title}
								totalAmount={totalAmount}
							/>
						),
					})
					.catch((error) => {
						console.error("Failed to send reviewer email:", error);
					});
			}

			return report;
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
			const existingReport = await ctx.db.report.findUnique({
				where: { id },
			});

			if (!existingReport) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Report not found",
				});
			}

			if (existingReport.ownerId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to update this report",
				});
			}

			// Update the report
			const report = await ctx.db.report.update({
				where: { id },
				data,
				include: {
					expenses: {
						include: {
							attachments: true,
						},
					},
					owner: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			// Calculate total amount and collect attachments
			const totalAmount = report.expenses.reduce(
				(sum, expense) => sum + Number(expense.amount),
				0,
			);
			const attachments = report.expenses.flatMap((expense) =>
				expense.attachments.map((attachment) => ({
					id: attachment.id,
					key: attachment.key,
				})),
			);

			// Get settings to find reviewer email
			const settings = await ctx.db.settings.findUnique({
				where: { id: "singleton" },
				select: {
					reviewerEmail: true,
				},
			});

			// Send email to creator (non-blocking)
			if (report.owner.email) {
				resend.emails
					.send({
						from: DEFAULT_EMAIL_FROM,
						to: [report.owner.email],
						subject: "Spesenantrag geändert",
						react: (
							<CreatorEmail
								accountingUnit={report.accountingUnit}
								attachments={attachments}
								businessUnit={report.businessUnit}
								description={report.description ?? ""}
								isCreated={false}
								reportId={report.id}
								title={report.title}
								totalAmount={totalAmount}
							/>
						),
					})
					.catch((error) => {
						console.error("Failed to send creator email:", error);
					});
			}

			// Send email to reviewer if configured (non-blocking)
			if (settings?.reviewerEmail) {
				resend.emails
					.send({
						from: DEFAULT_EMAIL_FROM,
						to: [settings.reviewerEmail],
						subject: "Spesenantrag geändert",
						react: (
							<StatusChangedEmail
								accountingUnit={report.accountingUnit}
								attachments={attachments}
								businessUnit={report.businessUnit}
								description={report.description ?? ""}
								isCreated={false}
								name={report.owner.name ?? "Unbekannt"}
								reportId={report.id}
								title={report.title}
								totalAmount={totalAmount}
							/>
						),
					})
					.catch((error) => {
						console.error("Failed to send reviewer email:", error);
					});
			}

			return report;
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
				include: {
					expenses: {
						include: {
							attachments: true,
						},
					},
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

			const totalAmount = result.expenses.reduce(
				(sum, expense) => sum + Number(expense.amount),
				0,
			);
			const attachments = result.expenses.flatMap((expense) =>
				expense.attachments.map((attachment) => ({
					id: attachment.id,
					key: attachment.key,
				})),
			);

			const { error } = await resend.emails.send({
				from: DEFAULT_EMAIL_FROM,
				to: [result.owner.email],
				subject: "Report status changed",
				react: (
					<StatusChangedEmail
						accountingUnit={result.accountingUnit}
						attachments={attachments}
						businessUnit={result.businessUnit}
						description={result.description ?? ""}
						isCreated={false}
						name={result.owner.name ?? "Unbekannt"}
						reportId={result.id}
						status={input.status}
						title={result.title}
						totalAmount={totalAmount}
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
});

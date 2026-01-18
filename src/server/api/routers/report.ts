import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ReportStatus } from "@/lib/enums";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { sendReportSubmittedEmail } from "@/server/email";

export const reportRouter = createTRPCRouter({
	// Get all reports for the current user
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.report.findMany({
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

	// Update report status (for accepting/declining)
	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.nativeEnum(ReportStatus),
			}),
		)
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

			// Only owner can change status to DRAFT or PENDING_APPROVAL
			// Admins can ACCEPT/REJECT or set NEEDS_REVISION
			if (
				(input.status === ReportStatus.DRAFT ||
					input.status === ReportStatus.PENDING_APPROVAL) &&
				report.ownerId !== ctx.session.user.id
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the owner can set this status",
				});
			}

			const updatedReport = await ctx.db.report.update({
				where: { id: input.id },
				data: { status: input.status },
				include: {
					expenses: true,
				},
			});

			// Send email notification when report is submitted for approval
			if (
				input.status === ReportStatus.PENDING_APPROVAL &&
				report.status !== ReportStatus.PENDING_APPROVAL
			) {
				// Don't await to avoid blocking the response
				sendReportSubmittedEmail(input.id).catch((error) => {
					console.error("Failed to send email notification:", error);
				});
			}

			return updatedReport;
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
});

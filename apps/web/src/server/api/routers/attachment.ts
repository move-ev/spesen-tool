import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { FileVisibility, ReportStatus } from "@/generated/prisma/enums";
import {
	downloadRateLimit,
	uploadRateLimit,
} from "@/server/api/middleware/rate-limit";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	cleanupDeletedAttachments,
	cleanupPendingAttachments,
} from "@/server/jobs/cleanup-pending-attachments";
import { validateFileContent } from "@/server/storage/file-validator";
import {
	generateAttachmentKey,
	generateFileHash,
	getFileExtension,
} from "@/server/storage/keys";
import {
	generatePresignedDownloadUrl,
	generatePresignedUploadUrl,
} from "@/server/storage/presigned";
import { verifyFileInS3 } from "@/server/storage/s3-client";
import { validateFileUpload } from "@/server/storage/validation";

export const attachmentRouter = createTRPCRouter({
	requestUploadUrl: protectedProcedure
		.use(uploadRateLimit)
		.input(
			z.object({
				reportId: z.string().optional(),
				organizationId: z.string().optional(),
				fileName: z.string(),
				fileSize: z.number(),
				contentType: z.string(),
				visibility: z.nativeEnum(FileVisibility).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Validate file
			const validation = validateFileUpload(
				input.fileName,
				input.fileSize,
				input.contentType,
			);

			if (!validation.valid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: validation.error ?? "File validation failed",
				});
			}

			// Determine visibility and context
			const visibility = input.visibility ?? FileVisibility.PRIVATE;
			let reportId: string | undefined;
			let organizationId: string | undefined;

			if (visibility === FileVisibility.PRIVATE) {
				if (!input.reportId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "reportId is required for private files",
					});
				}

				// Check report ownership and status
				const report = await ctx.db.report.findUnique({
					where: { id: input.reportId },
					select: {
						ownerId: true,
						status: true,
						organizationId: true,
					},
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
						message: "You don't have permission to upload to this report",
					});
				}

				if (
					report.status !== ReportStatus.DRAFT &&
					report.status !== ReportStatus.NEEDS_REVISION
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Can only upload to draft or needs revision reports",
					});
				}

				reportId = input.reportId;
				organizationId = report.organizationId;
			} else if (visibility === FileVisibility.PUBLIC) {
				if (!input.organizationId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "organizationId is required for public files",
					});
				}

				// Check organization membership
				const member = await ctx.db.member.findFirst({
					where: {
						organizationId: input.organizationId,
						userId: ctx.session.user.id,
					},
				});

				if (!member) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have permission to upload to this organization",
					});
				}

				organizationId = input.organizationId;
			}

			if (!organizationId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Unable to determine organization context",
				});
			}

			// Generate file hash and key with UUID for uniqueness
			const uniqueId = crypto.randomUUID();
			const hash = await generateFileHash(
				input.fileName,
				reportId ?? organizationId,
				uniqueId,
			);
			const extension = getFileExtension(input.fileName);

			const key = generateAttachmentKey({
				organizationId,
				reportId,
				hash,
				extension,
				visibility,
				type: !reportId ? "logo" : undefined,
			});

			// Generate presigned upload URL
			const uploadUrl = await generatePresignedUploadUrl({
				key,
				contentType: input.contentType,
				fileSizeBytes: input.fileSize,
			});

			// Create PENDING attachment record
			const attachment = await ctx.db.attachment.create({
				data: {
					key,
					originalName: input.fileName,
					contentType: input.contentType,
					size: input.fileSize,
					visibility,
					status: "PENDING",
					uploadedById: ctx.session.user.id,
					organizationId,
					// expenseId will be set when expense is created
				},
			});

			return {
				attachmentId: attachment.id,
				uploadUrl,
				key,
				expiresIn: 300, // 5 minutes
			};
		}),

	confirmUpload: protectedProcedure
		.input(
			z.object({
				attachmentId: z.string(),
				key: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Get attachment record with related data for re-validation
			const attachment = await ctx.db.attachment.findUnique({
				where: { id: input.attachmentId },
				include: {
					expense: {
						include: {
							report: {
								select: {
									ownerId: true,
									status: true,
								},
							},
						},
					},
				},
			});

			if (!attachment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attachment not found",
				});
			}

			if (attachment.uploadedById !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to confirm this upload",
				});
			}

			if (attachment.key !== input.key) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Key mismatch",
				});
			}

			// Re-validate permissions: Check if report is still editable
			// This prevents confirming uploads after report was finalized
			if (attachment.expense?.report) {
				const report = attachment.expense.report;

				// Check ownership hasn't changed
				if (report.ownerId !== ctx.session.user.id) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You no longer have permission to upload to this report",
					});
				}

				// Check report status is still editable
				if (
					report.status !== ReportStatus.DRAFT &&
					report.status !== ReportStatus.NEEDS_REVISION
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Cannot confirm upload - report status changed to finalized",
					});
				}
			}

			// Verify file exists in S3
			const exists = await verifyFileInS3(input.key);

			if (!exists) {
				// Mark as failed
				await ctx.db.attachment.update({
					where: { id: input.attachmentId },
					data: { status: "FAILED" },
				});

				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "File not found in storage",
				});
			}

			// Validate file content matches declared MIME type (prevent spoofing)
			if (attachment.contentType) {
				const validation = await validateFileContent(
					input.key,
					attachment.contentType,
				);

				if (!validation.valid) {
					// Mark as failed and log security issue
					await ctx.db.attachment.update({
						where: { id: input.attachmentId },
						data: { status: "FAILED" },
					});

					console.error(
						`[Security] File content validation failed for ${input.key}:`,
						validation.error,
					);

					throw new TRPCError({
						code: "BAD_REQUEST",
						message: validation.error ?? "File content does not match declared type",
					});
				}

				console.log(
					`[Attachment] File content validated: ${input.key} (${validation.detectedType})`,
				);
			}

			// Update status to UPLOADED
			await ctx.db.attachment.update({
				where: { id: input.attachmentId },
				data: { status: "UPLOADED" },
			});

			return { success: true };
		}),

	getDownloadUrl: protectedProcedure
		.use(downloadRateLimit)
		.input(z.object({ attachmentId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Get attachment with relations
			const attachment = await ctx.db.attachment.findUnique({
				where: { id: input.attachmentId },
				include: {
					expense: {
						include: {
							report: {
								select: {
									ownerId: true,
								},
							},
						},
					},
				},
			});

			if (!attachment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attachment not found",
				});
			}

			if (attachment.status !== "UPLOADED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Attachment is not available for download",
				});
			}

			if (attachment.deletedAt) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attachment has been deleted",
				});
			}

			// Permission check based on visibility
			const isAdmin = ctx.session.user.role === "admin";

			if (attachment.visibility === FileVisibility.PRIVATE) {
				// Check ownership
				const isOwner = attachment.expense?.report.ownerId === ctx.session.user.id;

				if (!isAdmin && !isOwner) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have permission to access this file",
					});
				}
			}
			// PUBLIC files are accessible to anyone with the link

			// Generate presigned download URL
			const url = await generatePresignedDownloadUrl({
				key: attachment.key,
				originalFileName: attachment.originalName ?? "download",
			});

			return {
				url,
				fileName: attachment.originalName,
				contentType: attachment.contentType,
				size: attachment.size,
			};
		}),

	delete: protectedProcedure
		.input(z.object({ attachmentId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Get attachment with relations
			const attachment = await ctx.db.attachment.findUnique({
				where: { id: input.attachmentId },
				include: {
					expense: {
						include: {
							report: {
								select: {
									ownerId: true,
									status: true,
								},
							},
						},
					},
				},
			});

			if (!attachment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attachment not found",
				});
			}

			// Check ownership
			const isOwner = attachment.expense?.report.ownerId === ctx.session.user.id;

			if (!isOwner) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to delete this attachment",
				});
			}

			// Check report status
			if (
				attachment.expense?.report.status !== ReportStatus.DRAFT &&
				attachment.expense?.report.status !== ReportStatus.NEEDS_REVISION
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot delete attachments from finalized reports",
				});
			}

			// Soft delete
			await ctx.db.attachment.update({
				where: { id: input.attachmentId },
				data: {
					deletedAt: new Date(),
					deletedById: ctx.session.user.id,
					status: "DELETED",
				},
			});

			// Optionally: Delete from S3 (commented out for audit trail)
			// await deleteFileFromS3(attachment.key);

			return { success: true };
		}),

	listForExpense: protectedProcedure
		.input(z.object({ expenseId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Get expense to check ownership
			const expense = await ctx.db.expense.findUnique({
				where: { id: input.expenseId },
				include: {
					report: {
						select: {
							ownerId: true,
						},
					},
				},
			});

			if (!expense) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			// Check ownership
			const isAdmin = ctx.session.user.role === "admin";
			const isOwner = expense.report.ownerId === ctx.session.user.id;

			if (!isAdmin && !isOwner) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to view these attachments",
				});
			}

			// Get attachments
			const attachments = await ctx.db.attachment.findMany({
				where: {
					expenseId: input.expenseId,
					deletedAt: null,
					status: "UPLOADED",
				},
				orderBy: {
					createdAt: "asc",
				},
			});

			return attachments;
		}),

	/**
	 * Manual trigger for cleanup job (admin only)
	 * Useful for testing or manual cleanup
	 */
	runCleanupJob: protectedProcedure
		.input(
			z.object({
				cleanPending: z.boolean().default(true),
				cleanDeleted: z.boolean().default(false),
				deletedRetentionDays: z.number().min(1).max(365).default(90),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Only admins can run cleanup jobs
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only admins can run cleanup jobs",
				});
			}

			const results: {
				pending?: Awaited<ReturnType<typeof cleanupPendingAttachments>>;
				deleted?: Awaited<ReturnType<typeof cleanupDeletedAttachments>>;
			} = {};

			if (input.cleanPending) {
				console.log("[Admin] Running PENDING attachments cleanup...");
				results.pending = await cleanupPendingAttachments();
			}

			if (input.cleanDeleted) {
				console.log(
					`[Admin] Running DELETED attachments cleanup (${input.deletedRetentionDays} days)...`,
				);
				results.deleted = await cleanupDeletedAttachments(
					input.deletedRetentionDays,
				);
			}

			return {
				success: true,
				results,
			};
		}),
});

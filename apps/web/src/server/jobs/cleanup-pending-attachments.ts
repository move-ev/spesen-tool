/**
 * Cleanup job for orphaned PENDING attachments
 *
 * This job runs periodically to:
 * 1. Delete PENDING attachment records older than 10 minutes (presigned URL expires in 5 min)
 * 2. Delete corresponding S3 objects to prevent storage accumulation
 *
 * Run via cron: star-slash-10 star star star star (every 10 minutes)
 * Or via API endpoint for manual trigger
 */

import { db } from "@/server/db";
import { deleteFileFromS3 } from "@/server/storage/s3-client";

const PENDING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

interface CleanupResult {
	deletedCount: number;
	s3DeletedCount: number;
	errors: string[];
}

export async function cleanupPendingAttachments(): Promise<CleanupResult> {
	const result: CleanupResult = {
		deletedCount: 0,
		s3DeletedCount: 0,
		errors: [],
	};

	try {
		console.log("[Cleanup] Starting cleanup of orphaned PENDING attachments...");

		const cutoffDate = new Date(Date.now() - PENDING_TIMEOUT_MS);

		// Find all PENDING attachments older than cutoff
		const pendingAttachments = await db.attachment.findMany({
			where: {
				status: "PENDING",
				createdAt: {
					lt: cutoffDate,
				},
			},
			select: {
				id: true,
				key: true,
				createdAt: true,
			},
		});

		console.log(
			`[Cleanup] Found ${pendingAttachments.length} orphaned PENDING attachments`,
		);

		if (pendingAttachments.length === 0) {
			return result;
		}

		// Delete from database in batch
		const deleteResult = await db.attachment.deleteMany({
			where: {
				id: {
					in: pendingAttachments.map((a) => a.id),
				},
			},
		});

		result.deletedCount = deleteResult.count;
		console.log(`[Cleanup] Deleted ${result.deletedCount} database records`);

		// Delete from S3 (in parallel, with error handling per file)
		const s3Deletions = await Promise.allSettled(
			pendingAttachments.map(async (attachment) => {
				try {
					await deleteFileFromS3(attachment.key);
					return { success: true, key: attachment.key };
				} catch (error) {
					const errorMsg = `Failed to delete S3 object ${attachment.key}: ${error instanceof Error ? error.message : String(error)}`;
					result.errors.push(errorMsg);
					console.error(`[Cleanup] ${errorMsg}`);
					return { success: false, key: attachment.key };
				}
			}),
		);

		// Count successful S3 deletions
		result.s3DeletedCount = s3Deletions.filter(
			(r) => r.status === "fulfilled" && r.value.success,
		).length;

		console.log(
			`[Cleanup] Deleted ${result.s3DeletedCount}/${pendingAttachments.length} S3 objects`,
		);

		if (result.errors.length > 0) {
			console.error(`[Cleanup] Completed with ${result.errors.length} errors`);
		} else {
			console.log("[Cleanup] Completed successfully");
		}
	} catch (error) {
		const errorMsg = `Cleanup job failed: ${error instanceof Error ? error.message : String(error)}`;
		console.error(`[Cleanup] ${errorMsg}`);
		result.errors.push(errorMsg);
	}

	return result;
}

/**
 * Cleanup job for soft-deleted attachments (retention policy)
 * Deletes attachments marked as DELETED for more than 90 days
 */
export async function cleanupDeletedAttachments(
	retentionDays = 90,
): Promise<CleanupResult> {
	const result: CleanupResult = {
		deletedCount: 0,
		s3DeletedCount: 0,
		errors: [],
	};

	try {
		console.log(
			`[Cleanup] Starting cleanup of DELETED attachments older than ${retentionDays} days...`,
		);

		const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

		// Find all DELETED attachments older than retention period
		const deletedAttachments = await db.attachment.findMany({
			where: {
				status: "DELETED",
				deletedAt: {
					not: null,
					lt: cutoffDate,
				},
			},
			select: {
				id: true,
				key: true,
				deletedAt: true,
			},
		});

		console.log(
			`[Cleanup] Found ${deletedAttachments.length} DELETED attachments past retention period`,
		);

		if (deletedAttachments.length === 0) {
			return result;
		}

		// Delete from S3 first (in parallel)
		const s3Deletions = await Promise.allSettled(
			deletedAttachments.map(async (attachment) => {
				try {
					await deleteFileFromS3(attachment.key);
					return { success: true, key: attachment.key };
				} catch (error) {
					const errorMsg = `Failed to delete S3 object ${attachment.key}: ${error instanceof Error ? error.message : String(error)}`;
					result.errors.push(errorMsg);
					console.error(`[Cleanup] ${errorMsg}`);
					return { success: false, key: attachment.key };
				}
			}),
		);

		result.s3DeletedCount = s3Deletions.filter(
			(r) => r.status === "fulfilled" && r.value.success,
		).length;

		// Delete from database (permanent)
		const deleteResult = await db.attachment.deleteMany({
			where: {
				id: {
					in: deletedAttachments.map((a) => a.id),
				},
			},
		});

		result.deletedCount = deleteResult.count;

		console.log(
			`[Cleanup] Permanently deleted ${result.deletedCount} database records and ${result.s3DeletedCount} S3 objects`,
		);

		if (result.errors.length > 0) {
			console.error(`[Cleanup] Completed with ${result.errors.length} errors`);
		} else {
			console.log("[Cleanup] Completed successfully");
		}
	} catch (error) {
		const errorMsg = `Cleanup job failed: ${error instanceof Error ? error.message : String(error)}`;
		console.error(`[Cleanup] ${errorMsg}`);
		result.errors.push(errorMsg);
	}

	return result;
}

// If running as standalone script
if (require.main === module) {
	console.log("Running cleanup jobs...");

	Promise.all([cleanupPendingAttachments(), cleanupDeletedAttachments()])
		.then(([pendingResult, deletedResult]) => {
			console.log("\n=== Cleanup Summary ===");
			console.log(
				`PENDING: Deleted ${pendingResult.deletedCount} DB records, ${pendingResult.s3DeletedCount} S3 objects`,
			);
			console.log(
				`DELETED: Deleted ${deletedResult.deletedCount} DB records, ${deletedResult.s3DeletedCount} S3 objects`,
			);
			console.log(
				`Total Errors: ${pendingResult.errors.length + deletedResult.errors.length}`,
			);
			process.exit(0);
		})
		.catch((error) => {
			console.error("Cleanup failed:", error);
			process.exit(1);
		});
}

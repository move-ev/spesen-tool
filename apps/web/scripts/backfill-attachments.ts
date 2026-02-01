/**
 * Backfill script for existing attachments
 *
 * This script updates existing attachment records with the new metadata fields:
 * - originalName: Extracted from key
 * - contentType: Inferred from file extension
 * - size: Set to 0 (unknown for old files)
 * - uploadedById: Set from expense.report.ownerId
 * - status: Set to UPLOADED
 * - visibility: Set to PRIVATE
 * - organizationId: Set from expense.report.organizationId
 *
 * Run with: npx tsx scripts/backfill-attachments.ts
 */

import { db } from "@/server/db";

const MIME_TYPE_MAP: Record<string, string> = {
	pdf: "application/pdf",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",
	gif: "image/gif",
};

function getFileExtension(filename: string): string {
	const lastDot = filename.lastIndexOf(".");
	if (lastDot === -1) return "";
	return filename.substring(lastDot + 1).toLowerCase();
}

function inferContentType(filename: string): string {
	const ext = getFileExtension(filename);
	return MIME_TYPE_MAP[ext] ?? "application/octet-stream";
}

function extractFilenameFromKey(key: string): string {
	// Key format: attachment/{filename} or attachments/private/{orgId}/{reportId}/{hash}.{ext}
	const parts = key.split("/");
	return parts[parts.length - 1] ?? "unknown";
}

async function backfillAttachments() {
	console.log("Starting attachment backfill...");

	// Get all attachments that need backfilling
	const attachments = await db.attachment.findMany({
		where: {
			OR: [{ originalName: null }, { contentType: null }, { uploadedById: null }],
		},
		include: {
			expense: {
				include: {
					report: {
						select: {
							ownerId: true,
							organizationId: true,
						},
					},
				},
			},
		},
	});

	console.log(`Found ${attachments.length} attachments to backfill`);

	let updated = 0;
	let skipped = 0;

	for (const attachment of attachments) {
		try {
			if (!attachment.expense) {
				console.warn(
					`Attachment ${attachment.id} has no associated expense, skipping`,
				);
				skipped++;
				continue;
			}

			const filename = extractFilenameFromKey(attachment.key);
			const contentType = inferContentType(filename);

			await db.attachment.update({
				where: { id: attachment.id },
				data: {
					originalName: filename,
					contentType,
					size: 0, // Unknown for legacy files
					uploadedById: attachment.expense.report.ownerId,
					status: "UPLOADED",
					visibility: "PRIVATE",
					organizationId: attachment.expense.report.organizationId,
				},
			});

			updated++;

			if (updated % 100 === 0) {
				console.log(`Progress: ${updated} attachments updated`);
			}
		} catch (error) {
			console.error(`Failed to update attachment ${attachment.id}:`, error);
			skipped++;
		}
	}

	console.log("\nBackfill complete!");
	console.log(`- Updated: ${updated}`);
	console.log(`- Skipped: ${skipped}`);
	console.log(`- Total: ${attachments.length}`);
}

// Run the backfill
backfillAttachments()
	.then(() => {
		console.log("Done!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Backfill failed:", error);
		process.exit(1);
	});

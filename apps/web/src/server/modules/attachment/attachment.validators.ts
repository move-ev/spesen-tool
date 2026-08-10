import z from "zod";

/** Per-file upload ceiling, applied on every path that accepts an attachment. */
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

/** Attachments accepted in one upload batch (presign, persist, cleanup). */
export const MAX_ATTACHMENTS_PER_UPLOAD = 5;

/**
 * Total attachments a single expense may hold. Distinct from
 * {@link MAX_ATTACHMENTS_PER_UPLOAD} — that bounds one request, this bounds the
 * accumulated result of many — and the two are free to diverge.
 */
export const MAX_ATTACHMENTS_PER_EXPENSE = 5;

/** Maximum number of attachment ids accepted for one batch-download request. */
export const MAX_BATCH_DOWNLOAD_IDS = 100;

/**
 * Storage key layout: `attachment/{organizationId}/{uuid.ext}`. Shape only —
 * the service still verifies the key belongs to the caller's organization.
 */
export const attachmentKeySchema = z
	.string()
	.regex(/^attachment\/[^/]+\/[^/]+$/, "Ungültiges Anhang-Schlüsselformat");

export const attachmentInputSchema = z.object({
	key: attachmentKeySchema,
	size: z
		.number()
		.int()
		.nonnegative()
		.max(MAX_ATTACHMENT_SIZE_BYTES, "Datei überschreitet das 5-MB-Limit")
		.transform((n) => BigInt(n)),
	originalName: z.string().min(1),
});

export const getBatchDownloadUrlsSchema = z.object({
	ids: z
		.array(z.string().min(1))
		.min(1)
		.max(MAX_BATCH_DOWNLOAD_IDS)
		.refine((ids) => new Set(ids).size === ids.length, {
			message: "Anhang-IDs müssen eindeutig sein",
		}),
});

export const getUploadUrlsSchema = z.object({
	files: z
		.array(
			z.object({
				name: z.string().min(1),
				contentType: z.string().min(1),
				size: z
					.number()
					.int()
					.nonnegative()
					.max(MAX_ATTACHMENT_SIZE_BYTES, "Datei überschreitet das 5-MB-Limit"),
			}),
		)
		.min(1)
		.max(MAX_ATTACHMENTS_PER_UPLOAD),
});

export const addAttachmentsToExpenseSchema = z.object({
	attachments: z
		.array(
			z.object({
				key: attachmentKeySchema,
				size: z.number().int().nonnegative().max(MAX_ATTACHMENT_SIZE_BYTES),
				originalName: z.string().min(1),
			}),
		)
		.min(1)
		.max(MAX_ATTACHMENTS_PER_UPLOAD),
});

export const deletePendingUploadsSchema = z.object({
	keys: z.array(attachmentKeySchema).max(MAX_ATTACHMENTS_PER_UPLOAD),
});

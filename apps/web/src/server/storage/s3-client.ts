import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/env";

/**
 * S3 client for fetching files from storage
 */
function createS3Client(): S3Client {
	const host = env.STORAGE_HOST;
	const region = env.STORAGE_REGION;
	const secure = env.STORAGE_SECURE;
	const forcePathStyle = env.STORAGE_FORCE_PATH_STYLE;

	const protocol = secure ? "https" : "http";
	const endpoint = `${protocol}://${host}`;

	return new S3Client({
		region,
		endpoint,
		forcePathStyle,
		credentials: {
			accessKeyId: env.STORAGE_ACCESS_KEY_ID,
			secretAccessKey: env.STORAGE_ACCESS_KEY,
		},
	});
}

// Lazy-initialized S3 client
let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
	if (!s3Client) {
		s3Client = createS3Client();
	}
	return s3Client;
}

/**
 * Fetch a file from S3 storage by its key
 * @param key - The object key (e.g., "attachment/filename.pdf")
 * @returns The file contents as a Buffer, or null if fetch fails
 */
export async function getFileFromStorage(key: string): Promise<Buffer | null> {
	const client = getS3Client();
	const bucket = env.STORAGE_BUCKET;

	try {
		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});

		const response = await client.send(command);

		if (!response.Body) {
			console.error(`[S3] No body in response for key: ${key}`);
			return null;
		}

		// Convert the readable stream to a buffer
		const chunks: Uint8Array[] = [];
		for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
			chunks.push(chunk);
		}

		return Buffer.concat(chunks);
	} catch (error) {
		console.error(`[S3] Failed to fetch file with key: ${key}`, error);
		return null;
	}
}

/**
 * Get the file extension from a storage key
 * @param key - The object key (e.g., "attachment/filename.pdf")
 * @returns The file extension in lowercase (e.g., "pdf")
 */
export function getFileExtension(key: string): string {
	// Extract the filename from the path first
	const filename = key.split("/").at(-1) ?? "";
	// Then get the extension from the filename
	const parts = filename.split(".");
	if (parts.length <= 1) return "";
	const ext = parts.at(-1);
	return ext ? ext.toLowerCase() : "";
}

/**
 * Check if a file is an image based on its extension
 */
export function isImageFile(key: string): boolean {
	const ext = getFileExtension(key);
	return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
}

/**
 * Check if a file is a PDF based on its extension
 */
export function isPdfFile(key: string): boolean {
	return getFileExtension(key) === "pdf";
}

/**
 * Verify that a file exists in S3
 * @param key - The object key to check
 * @returns true if the file exists, false otherwise
 */
export async function verifyFileInS3(key: string): Promise<boolean> {
	const client = getS3Client();
	const bucket = env.STORAGE_BUCKET;

	try {
		await client.send(
			new HeadObjectCommand({
				Bucket: bucket,
				Key: key,
			}),
		);
		console.log(`[S3] File verified: ${key}`);
		return true;
	} catch (error) {
		// Distinguish between different error types
		if (error instanceof Error) {
			// NotFound error is expected when file doesn't exist
			if (error.name === "NotFound" || error.message.includes("NotFound")) {
				console.log(`[S3] File not found: ${key}`);
				return false;
			}

			// Other errors (permissions, network, etc.) should be logged
			console.error(`[S3] Error verifying file ${key}:`, {
				name: error.name,
				message: error.message,
				stack: error.stack,
			});
		} else {
			console.error(`[S3] Unknown error verifying file ${key}:`, error);
		}

		return false;
	}
}

/**
 * Delete a file from S3
 * @param key - The object key to delete
 * @throws Error if deletion fails
 */
export async function deleteFileFromS3(key: string): Promise<void> {
	const client = getS3Client();
	const bucket = env.STORAGE_BUCKET;

	try {
		await client.send(
			new DeleteObjectCommand({
				Bucket: bucket,
				Key: key,
			}),
		);
		console.log(`[S3] File deleted: ${key}`);
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(`[S3] Failed to delete file ${key}:`, {
			error: errorMsg,
			key,
			bucket,
		});
		throw new Error(`Failed to delete file from S3: ${errorMsg}`);
	}
}

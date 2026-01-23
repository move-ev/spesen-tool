import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env";
import {
	getStorageBucket,
	getStorageForcePathStyle,
	getStorageHost,
	getStorageRegion,
	getStorageSecure,
} from "@/lib/config";

/**
 * S3 client for fetching files from storage
 */
function createS3Client(): S3Client {
	const host = getStorageHost();
	const region = getStorageRegion();
	const secure = getStorageSecure();
	const forcePathStyle = getStorageForcePathStyle();

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

function getS3Client(): S3Client {
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
	const bucket = getStorageBucket();

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
	const parts = key.split(".");
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

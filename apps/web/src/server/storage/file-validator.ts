/**
 * Server-side file content validation using magic numbers
 * This prevents MIME type spoofing by checking actual file bytes
 */

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";
import { getS3Client } from "./s3-client";

/**
 * Magic number signatures for allowed file types
 * First few bytes of file that identify the file format
 */
const FILE_SIGNATURES = {
	// PDF
	pdf: [0x25, 0x50, 0x44, 0x46], // %PDF

	// JPEG
	jpeg: [0xff, 0xd8, 0xff],

	// PNG
	png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],

	// GIF
	gif87a: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
	gif89a: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a

	// WebP
	webp: [0x52, 0x49, 0x46, 0x46], // RIFF (check bytes 8-11 for WEBP)
} as const;

/**
 * Check if byte array starts with signature
 */
function matchesSignature(
	bytes: Uint8Array,
	signature: readonly number[],
): boolean {
	if (bytes.length < signature.length) return false;

	for (let i = 0; i < signature.length; i++) {
		if (bytes[i] !== signature[i]) return false;
	}

	return true;
}

/**
 * Detect actual file type from magic numbers
 */
function detectFileType(bytes: Uint8Array): string | null {
	// PDF
	if (matchesSignature(bytes, FILE_SIGNATURES.pdf)) {
		return "application/pdf";
	}

	// JPEG
	if (matchesSignature(bytes, FILE_SIGNATURES.jpeg)) {
		return "image/jpeg";
	}

	// PNG
	if (matchesSignature(bytes, FILE_SIGNATURES.png)) {
		return "image/png";
	}

	// GIF
	if (
		matchesSignature(bytes, FILE_SIGNATURES.gif87a) ||
		matchesSignature(bytes, FILE_SIGNATURES.gif89a)
	) {
		return "image/gif";
	}

	// WebP (check RIFF header + WEBP at offset 8)
	if (matchesSignature(bytes, FILE_SIGNATURES.webp)) {
		// WebP has "WEBP" at bytes 8-11
		const webpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
		if (bytes.length >= 12) {
			let isWebP = true;
			for (let i = 0; i < 4; i++) {
				if (bytes[8 + i] !== webpSignature[i]) {
					isWebP = false;
					break;
				}
			}
			if (isWebP) return "image/webp";
		}
	}

	return null;
}

/**
 * Validate file content from S3 matches declared MIME type
 * @param key - S3 object key
 * @param declaredMimeType - MIME type provided by client
 * @returns Validation result with actual detected type
 */
export async function validateFileContent(
	key: string,
	declaredMimeType: string,
): Promise<{
	valid: boolean;
	detectedType: string | null;
	error?: string;
}> {
	const client = getS3Client();
	const bucket = env.STORAGE_BUCKET;

	try {
		// Fetch only first 16 bytes (enough for all magic numbers)
		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
			Range: "bytes=0-15",
		});

		const response = await client.send(command);

		if (!response.Body) {
			return {
				valid: false,
				detectedType: null,
				error: "No file content received from S3",
			};
		}

		// Read bytes
		const chunks: Uint8Array[] = [];
		for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
			chunks.push(chunk);
		}
		const bytes = new Uint8Array(
			chunks.reduce((acc, chunk) => acc + chunk.length, 0),
		);
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.length;
		}

		// Detect actual file type
		const detectedType = detectFileType(bytes);

		if (!detectedType) {
			return {
				valid: false,
				detectedType: null,
				error: "Unable to detect file type from content",
			};
		}

		// Normalize MIME types for comparison (jpeg vs jpg)
		const normalizedDeclared = declaredMimeType.toLowerCase();
		const normalizedDetected = detectedType.toLowerCase();

		// Allow image/jpg as alias for image/jpeg
		const matches =
			normalizedDeclared === normalizedDetected ||
			(normalizedDeclared === "image/jpg" &&
				normalizedDetected === "image/jpeg") ||
			(normalizedDeclared === "image/jpeg" && normalizedDetected === "image/jpg");

		if (!matches) {
			return {
				valid: false,
				detectedType,
				error: `File content type mismatch: declared ${declaredMimeType}, detected ${detectedType}`,
			};
		}

		console.log(
			`[FileValidator] File validation passed: ${key} (${detectedType})`,
		);

		return {
			valid: true,
			detectedType,
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(`[FileValidator] Validation failed for ${key}:`, errorMsg);

		return {
			valid: false,
			detectedType: null,
			error: `File validation error: ${errorMsg}`,
		};
	}
}

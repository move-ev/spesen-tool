import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";
import { getS3Client } from "./s3-client";

export async function generatePresignedUploadUrl(params: {
	key: string;
	contentType: string;
	fileSizeBytes: number;
	expiresIn?: number;
}): Promise<string> {
	const { key, contentType, fileSizeBytes, expiresIn = 300 } = params;
	const client = getS3Client();

	const command = new PutObjectCommand({
		Bucket: env.STORAGE_BUCKET,
		Key: key,
		ContentType: contentType,
		ContentLength: fileSizeBytes,
	});

	// @ts-expect-error - AWS SDK type compatibility issue between client-s3 and s3-request-presigner
	return await getSignedUrl(client, command, { expiresIn });
}

export async function generatePresignedDownloadUrl(params: {
	key: string;
	originalFileName: string;
	expiresIn?: number;
}): Promise<string> {
	const { key, originalFileName, expiresIn = 3600 } = params;
	const client = getS3Client();

	const command = new GetObjectCommand({
		Bucket: env.STORAGE_BUCKET,
		Key: key,
		ResponseContentDisposition: `attachment; filename="${originalFileName}"`,
	});

	// @ts-expect-error - AWS SDK type compatibility issue between client-s3 and s3-request-presigner
	return await getSignedUrl(client, command, { expiresIn });
}

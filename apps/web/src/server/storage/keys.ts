/**
 * Generate a unique file hash using UUID + context
 * This prevents race conditions from concurrent uploads
 */
export async function generateFileHash(
	fileName: string,
	contextId: string, // reportId or orgId
	uniqueId: string, // UUID for uniqueness
): Promise<string> {
	const data = `${fileName}-${contextId}-${uniqueId}-${Date.now()}`;
	const encoder = new TextEncoder();
	const buffer = encoder.encode(data);
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getFileExtension(fileName: string): string {
	const lastDot = fileName.lastIndexOf(".");
	if (lastDot === -1) return "";
	return fileName.substring(lastDot + 1).toLowerCase();
}

export function generateAttachmentKey(params: {
	organizationId: string;
	reportId?: string;
	hash: string;
	extension: string;
	visibility: "PRIVATE" | "PUBLIC";
	type?: "logo"; // For public org assets
}): string {
	const { organizationId, reportId, hash, extension, visibility, type } = params;

	if (visibility === "PUBLIC" && type === "logo") {
		return `attachments/public/${organizationId}/logo/${hash}.${extension}`;
	}

	if (visibility === "PRIVATE" && reportId) {
		return `attachments/private/${organizationId}/${reportId}/${hash}.${extension}`;
	}

	throw new Error("Invalid key generation parameters");
}

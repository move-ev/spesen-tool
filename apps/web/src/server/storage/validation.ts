const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
];

const BLOCKED_EXTENSIONS = [
	"exe",
	"bat",
	"cmd",
	"sh",
	"ps1",
	"app",
	"dmg",
	"deb",
	"rpm",
];

export function validateFileUpload(
	fileName: string,
	fileSize: number,
	contentType: string,
): { valid: boolean; error?: string } {
	// Size check
	if (fileSize > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `File size exceeds maximum of 5MB`,
		};
	}

	// MIME type check
	if (!ALLOWED_MIME_TYPES.includes(contentType)) {
		return {
			valid: false,
			error: `File type ${contentType} not allowed`,
		};
	}

	// Extension check
	const ext = fileName.split(".").pop()?.toLowerCase();
	if (ext && BLOCKED_EXTENSIONS.includes(ext)) {
		return {
			valid: false,
			error: `File extension .${ext} not allowed`,
		};
	}

	return { valid: true };
}

import { describe, expect, it } from "vitest";
import { validateFileUpload } from "../validation";

describe("validateFileUpload", () => {
	describe("file size validation", () => {
		it("should accept files under 5MB", () => {
			const result = validateFileUpload(
				"test.pdf",
				4 * 1024 * 1024, // 4MB
				"application/pdf",
			);

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should accept files exactly 5MB", () => {
			const result = validateFileUpload(
				"test.pdf",
				5 * 1024 * 1024, // 5MB
				"application/pdf",
			);

			expect(result.valid).toBe(true);
		});

		it("should reject files over 5MB", () => {
			const result = validateFileUpload(
				"large.pdf",
				6 * 1024 * 1024, // 6MB
				"application/pdf",
			);

			expect(result.valid).toBe(false);
			expect(result.error).toContain("exceeds maximum");
		});

		it("should reject files significantly over limit", () => {
			const result = validateFileUpload(
				"huge.pdf",
				100 * 1024 * 1024, // 100MB
				"application/pdf",
			);

			expect(result.valid).toBe(false);
			expect(result.error).toBe("File size exceeds maximum of 5MB");
		});
	});

	describe("MIME type validation", () => {
		it("should accept PDF files", () => {
			const result = validateFileUpload("document.pdf", 1024, "application/pdf");

			expect(result.valid).toBe(true);
		});

		it("should accept JPEG images", () => {
			const result = validateFileUpload("photo.jpg", 1024, "image/jpeg");

			expect(result.valid).toBe(true);
		});

		it("should accept PNG images", () => {
			const result = validateFileUpload("screenshot.png", 1024, "image/png");

			expect(result.valid).toBe(true);
		});

		it("should accept WebP images", () => {
			const result = validateFileUpload("image.webp", 1024, "image/webp");

			expect(result.valid).toBe(true);
		});

		it("should accept GIF images", () => {
			const result = validateFileUpload("animation.gif", 1024, "image/gif");

			expect(result.valid).toBe(true);
		});

		it("should reject executable files", () => {
			const result = validateFileUpload("malware.exe", 1024, "application/exe");

			expect(result.valid).toBe(false);
			expect(result.error).toContain("not allowed");
		});

		it("should reject Word documents", () => {
			const result = validateFileUpload(
				"document.docx",
				1024,
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			);

			expect(result.valid).toBe(false);
		});

		it("should reject video files", () => {
			const result = validateFileUpload("video.mp4", 1024, "video/mp4");

			expect(result.valid).toBe(false);
		});
	});

	describe("file extension validation", () => {
		it("should reject blocked executable extensions", () => {
			const blockedExtensions = ["exe", "bat", "cmd", "sh", "ps1", "app"];

			blockedExtensions.forEach((ext) => {
				const result = validateFileUpload(
					`file.${ext}`,
					1024,
					"application/pdf", // Spoofed MIME type
				);

				expect(result.valid).toBe(false);
				expect(result.error).toContain(`extension .${ext} not allowed`);
			});
		});

		it("should accept files with allowed extensions", () => {
			const result = validateFileUpload("receipt.pdf", 1024, "application/pdf");

			expect(result.valid).toBe(true);
		});

		it("should handle files without extensions", () => {
			const result = validateFileUpload("noextension", 1024, "application/pdf");

			expect(result.valid).toBe(true);
		});

		it("should be case-insensitive for extensions", () => {
			const result = validateFileUpload("FILE.EXE", 1024, "application/pdf");

			expect(result.valid).toBe(false);
			expect(result.error).toContain(".exe");
		});

		it("should handle multiple dots in filename", () => {
			const result = validateFileUpload(
				"file.backup.pdf",
				1024,
				"application/pdf",
			);

			expect(result.valid).toBe(true);
		});
	});

	describe("combined validation", () => {
		it("should pass all checks for valid PDF", () => {
			const result = validateFileUpload(
				"receipt.pdf",
				2 * 1024 * 1024,
				"application/pdf",
			);

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should fail if any check fails (size)", () => {
			const result = validateFileUpload(
				"receipt.pdf",
				10 * 1024 * 1024, // Too large
				"application/pdf",
			);

			expect(result.valid).toBe(false);
		});

		it("should fail if any check fails (MIME type)", () => {
			const result = validateFileUpload(
				"file.pdf",
				1024,
				"application/x-executable", // Wrong type
			);

			expect(result.valid).toBe(false);
		});

		it("should fail if any check fails (extension)", () => {
			const result = validateFileUpload(
				"malware.exe",
				1024,
				"application/pdf", // Spoofed
			);

			expect(result.valid).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle zero-byte files", () => {
			const result = validateFileUpload("empty.pdf", 0, "application/pdf");

			expect(result.valid).toBe(true);
		});

		it("should handle special characters in filename", () => {
			const result = validateFileUpload(
				"file (1) - copy.pdf",
				1024,
				"application/pdf",
			);

			expect(result.valid).toBe(true);
		});

		it("should handle unicode characters in filename", () => {
			const result = validateFileUpload("文件.pdf", 1024, "application/pdf");

			expect(result.valid).toBe(true);
		});
	});
});

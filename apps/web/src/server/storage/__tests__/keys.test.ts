import { describe, expect, it } from "vitest";
import {
	generateAttachmentKey,
	generateFileHash,
	getFileExtension,
} from "../keys";

describe("generateFileHash", () => {
	it("should generate a valid SHA-256 hash", async () => {
		const hash = await generateFileHash("test.pdf", "context123", "uuid-1");

		expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex chars
		expect(hash.length).toBe(64);
	});

	it("should generate different hashes for different UUIDs", async () => {
		const hash1 = await generateFileHash("test.pdf", "context123", "uuid-1");
		const hash2 = await generateFileHash("test.pdf", "context123", "uuid-2");

		expect(hash1).not.toBe(hash2);
	});

	it("should generate different hashes for different filenames", async () => {
		const hash1 = await generateFileHash("file1.pdf", "context123", "uuid-1");
		const hash2 = await generateFileHash("file2.pdf", "context123", "uuid-1");

		expect(hash1).not.toBe(hash2);
	});

	it("should generate different hashes for different contexts", async () => {
		const hash1 = await generateFileHash("test.pdf", "context1", "uuid-1");
		const hash2 = await generateFileHash("test.pdf", "context2", "uuid-1");

		expect(hash1).not.toBe(hash2);
	});

	it("should handle special characters in filename", async () => {
		const hash = await generateFileHash(
			"file (1) - copy.pdf",
			"context123",
			"uuid-1",
		);

		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	it("should handle unicode characters", async () => {
		const hash = await generateFileHash("文件.pdf", "context123", "uuid-1");

		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	it("should produce unique hashes for concurrent uploads", async () => {
		// Simulate concurrent uploads with different UUIDs
		const uploads = Array.from({ length: 100 }, (_, i) => ({
			fileName: "receipt.pdf",
			contextId: "report123",
			uniqueId: `uuid-${i}`,
		}));

		const hashes = await Promise.all(
			uploads.map((u) => generateFileHash(u.fileName, u.contextId, u.uniqueId)),
		);

		// All hashes should be unique
		const uniqueHashes = new Set(hashes);
		expect(uniqueHashes.size).toBe(100);
	});
});

describe("getFileExtension", () => {
	it("should extract extension from simple filename", () => {
		expect(getFileExtension("file.pdf")).toBe("pdf");
		expect(getFileExtension("image.jpg")).toBe("jpg");
		expect(getFileExtension("document.txt")).toBe("txt");
	});

	it("should return lowercase extension", () => {
		expect(getFileExtension("FILE.PDF")).toBe("pdf");
		expect(getFileExtension("Image.JPG")).toBe("jpg");
		expect(getFileExtension("Document.TXT")).toBe("txt");
	});

	it("should handle multiple dots", () => {
		expect(getFileExtension("file.backup.pdf")).toBe("pdf");
		expect(getFileExtension("archive.tar.gz")).toBe("gz");
	});

	it("should handle files without extension", () => {
		expect(getFileExtension("noextension")).toBe("");
		expect(getFileExtension("README")).toBe("");
	});

	it("should handle hidden files", () => {
		expect(getFileExtension(".gitignore")).toBe("gitignore");
		expect(getFileExtension(".env")).toBe("env");
	});

	it("should handle empty string", () => {
		expect(getFileExtension("")).toBe("");
	});

	it("should handle filename ending with dot", () => {
		expect(getFileExtension("file.")).toBe("");
	});

	it("should handle paths with slashes", () => {
		expect(getFileExtension("/path/to/file.pdf")).toBe("pdf");
		expect(getFileExtension("folder/file.jpg")).toBe("jpg");
	});
});

describe("generateAttachmentKey", () => {
	describe("PRIVATE receipts", () => {
		it("should generate key for private receipt", () => {
			const key = generateAttachmentKey({
				organizationId: "org123",
				reportId: "report456",
				hash: "abc123def456",
				extension: "pdf",
				visibility: "PRIVATE",
			});

			expect(key).toBe("attachments/private/org123/report456/abc123def456.pdf");
		});

		it("should include all path segments", () => {
			const key = generateAttachmentKey({
				organizationId: "org-uuid-123",
				reportId: "report-uuid-456",
				hash: "longhash",
				extension: "jpg",
				visibility: "PRIVATE",
			});

			expect(key).toContain("attachments/private/");
			expect(key).toContain("org-uuid-123");
			expect(key).toContain("report-uuid-456");
			expect(key).toContain("longhash.jpg");
		});

		it("should throw if reportId missing for PRIVATE", () => {
			expect(() =>
				generateAttachmentKey({
					organizationId: "org123",
					hash: "abc123",
					extension: "pdf",
					visibility: "PRIVATE",
					// reportId missing
				}),
			).toThrow("Invalid key generation parameters");
		});
	});

	describe("PUBLIC logos", () => {
		it("should generate key for public logo", () => {
			const key = generateAttachmentKey({
				organizationId: "org123",
				hash: "abc123def456",
				extension: "png",
				visibility: "PUBLIC",
				type: "logo",
			});

			expect(key).toBe("attachments/public/org123/logo/abc123def456.png");
		});

		it("should support different image formats", () => {
			const extensions = ["png", "jpg", "webp", "gif"];

			extensions.forEach((ext) => {
				const key = generateAttachmentKey({
					organizationId: "org123",
					hash: "abc123",
					extension: ext,
					visibility: "PUBLIC",
					type: "logo",
				});

				expect(key).toBe(`attachments/public/org123/logo/abc123.${ext}`);
			});
		});

		it("should throw if type is not 'logo' for PUBLIC", () => {
			expect(() =>
				generateAttachmentKey({
					organizationId: "org123",
					hash: "abc123",
					extension: "png",
					visibility: "PUBLIC",
					// type missing
				}),
			).toThrow("Invalid key generation parameters");
		});
	});

	describe("edge cases", () => {
		it("should handle long organization IDs", () => {
			const key = generateAttachmentKey({
				organizationId: "org-very-long-uuid-1234567890-abcdef",
				reportId: "report123",
				hash: "hash",
				extension: "pdf",
				visibility: "PRIVATE",
			});

			expect(key).toContain("org-very-long-uuid-1234567890-abcdef");
		});

		it("should handle special characters in hash", () => {
			const key = generateAttachmentKey({
				organizationId: "org123",
				reportId: "report456",
				hash: "a1b2c3d4e5f6",
				extension: "pdf",
				visibility: "PRIVATE",
			});

			expect(key).toContain("a1b2c3d4e5f6.pdf");
		});

		it("should preserve extension case", () => {
			const key = generateAttachmentKey({
				organizationId: "org123",
				reportId: "report456",
				hash: "abc",
				extension: "PDF", // Uppercase
				visibility: "PRIVATE",
			});

			expect(key).toContain(".PDF");
		});
	});

	describe("path structure validation", () => {
		it("should always start with 'attachments/'", () => {
			const privateKey = generateAttachmentKey({
				organizationId: "org123",
				reportId: "report456",
				hash: "abc",
				extension: "pdf",
				visibility: "PRIVATE",
			});

			const publicKey = generateAttachmentKey({
				organizationId: "org123",
				hash: "abc",
				extension: "png",
				visibility: "PUBLIC",
				type: "logo",
			});

			expect(privateKey).toMatch(/^attachments\//);
			expect(publicKey).toMatch(/^attachments\//);
		});

		it("should use forward slashes as path separator", () => {
			const key = generateAttachmentKey({
				organizationId: "org123",
				reportId: "report456",
				hash: "abc",
				extension: "pdf",
				visibility: "PRIVATE",
			});

			expect(key).not.toContain("\\");
			expect(key.split("/").length).toBe(5); // attachments/private/org/report/file
		});
	});
});

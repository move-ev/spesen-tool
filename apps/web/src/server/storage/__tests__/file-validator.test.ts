// biome-ignore-all lint/suspicious/noExplicitAny: Disable linter for now
// biome-ignore-all lint/style/noNonNullAssertion: Disable linter for now
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateFileContent } from "../file-validator";

// Mock S3 client
vi.mock("../s3-client", () => ({
	getS3Client: vi.fn(() => ({
		send: vi.fn(),
	})),
}));

vi.mock("@/env", () => ({
	env: {
		STORAGE_BUCKET: "test-bucket",
	},
}));

describe("validateFileContent", () => {
	let mockS3Send: any;

	beforeEach(async () => {
		const { getS3Client } = await import("../s3-client");
		mockS3Send = vi.fn();
		vi.mocked(getS3Client).mockReturnValue({
			send: mockS3Send,
		} as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("PDF validation", () => {
		it("should accept valid PDF files", async () => {
			// PDF magic number: %PDF
			const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield pdfBytes;
					},
				},
			});

			const result = await validateFileContent("test-key", "application/pdf");

			expect(result.valid).toBe(true);
			expect(result.detectedType).toBe("application/pdf");
			expect(result.error).toBeUndefined();
		});

		it("should reject file with wrong magic number", async () => {
			// JPEG magic number when PDF expected
			const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield jpegBytes;
					},
				},
			});

			const result = await validateFileContent("test-key", "application/pdf");

			expect(result.valid).toBe(false);
			expect(result.detectedType).toBe("image/jpeg");
			expect(result.error).toContain("type mismatch");
		});
	});

	describe("JPEG validation", () => {
		it("should accept valid JPEG files", async () => {
			// JPEG magic number: FF D8 FF
			const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield jpegBytes;
					},
				},
			});

			const result = await validateFileContent("test-key", "image/jpeg");

			expect(result.valid).toBe(true);
			expect(result.detectedType).toBe("image/jpeg");
		});

		it("should accept image/jpg as alias for image/jpeg", async () => {
			const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield jpegBytes;
					},
				},
			});

			const result = await validateFileContent("test-key", "image/jpg");

			expect(result.valid).toBe(true);
			expect(result.detectedType).toBe("image/jpeg");
		});
	});

	describe("PNG validation", () => {
		it("should accept valid PNG files", async () => {
			// PNG magic number: 89 50 4E 47 0D 0A 1A 0A
			const pngBytes = new Uint8Array([
				0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
			]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield pngBytes;
					},
				},
			});

			const result = await validateFileContent("test-key", "image/png");

			expect(result.valid).toBe(true);
			expect(result.detectedType).toBe("image/png");
		});
	});

	describe("GIF validation", () => {
		it("should accept GIF87a format", async () => {
			// GIF87a magic number
			const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield gifBytes;
					},
				},
			});

			const result = await validateFileContent("test-key", "image/gif");

			expect(result.valid).toBe(true);
			expect(result.detectedType).toBe("image/gif");
		});

		it("should accept GIF89a format", async () => {
			// GIF89a magic number
			const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield gifBytes;
					},
				},
			});

			const result = await validateFileContent("test-key", "image/gif");

			expect(result.valid).toBe(true);
			expect(result.detectedType).toBe("image/gif");
		});
	});

	describe("WebP validation", () => {
		it("should accept valid WebP files", async () => {
			// WebP: RIFF....WEBP
			const webpBytes = new Uint8Array([
				0x52,
				0x49,
				0x46,
				0x46, // RIFF
				0x00,
				0x00,
				0x00,
				0x00, // Size (placeholder)
				0x57,
				0x45,
				0x42,
				0x50, // WEBP
			]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield webpBytes;
					},
				},
			});

			const result = await validateFileContent("test-key", "image/webp");

			expect(result.valid).toBe(true);
			expect(result.detectedType).toBe("image/webp");
		});

		it("should reject RIFF files that are not WebP", async () => {
			// RIFF but not WebP (could be WAV or AVI)
			const riffBytes = new Uint8Array([
				0x52,
				0x49,
				0x46,
				0x46, // RIFF
				0x00,
				0x00,
				0x00,
				0x00,
				0x57,
				0x41,
				0x56,
				0x45, // WAVE (not WEBP)
			]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield riffBytes;
					},
				},
			});

			const result = await validateFileContent("test-key", "image/webp");

			expect(result.valid).toBe(false);
			expect(result.detectedType).toBeNull();
		});
	});

	describe("spoofing detection", () => {
		it("should detect executable disguised as PDF", async () => {
			// PE executable magic number: MZ
			const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield exeBytes;
					},
				},
			});

			const result = await validateFileContent("malware.pdf", "application/pdf");

			expect(result.valid).toBe(false);
			expect(result.detectedType).toBeNull();
			expect(result.error).toContain("Unable to detect file type");
		});

		it("should detect JPEG disguised as PDF", async () => {
			const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield jpegBytes;
					},
				},
			});

			const result = await validateFileContent("fake.pdf", "application/pdf");

			expect(result.valid).toBe(false);
			expect(result.detectedType).toBe("image/jpeg");
			expect(result.error).toContain("mismatch");
		});
	});

	describe("error handling", () => {
		it("should handle S3 errors gracefully", async () => {
			mockS3Send.mockRejectedValue(new Error("S3 connection failed"));

			const result = await validateFileContent("test-key", "application/pdf");

			expect(result.valid).toBe(false);
			expect(result.detectedType).toBeNull();
			expect(result.error).toContain("File validation error");
		});

		it("should handle missing response body", async () => {
			mockS3Send.mockResolvedValue({
				Body: null,
			});

			const result = await validateFileContent("test-key", "application/pdf");

			expect(result.valid).toBe(false);
			expect(result.error).toContain("No file content received");
		});

		it("should handle empty file", async () => {
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield new Uint8Array([]);
					},
				},
			});

			const result = await validateFileContent("empty.pdf", "application/pdf");

			expect(result.valid).toBe(false);
			expect(result.error).toContain("Unable to detect file type");
		});

		it("should handle truncated files", async () => {
			// Only 2 bytes when we need at least 3 for JPEG
			const truncatedBytes = new Uint8Array([0xff, 0xd8]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield truncatedBytes;
					},
				},
			});

			const result = await validateFileContent("test.jpg", "image/jpeg");

			expect(result.valid).toBe(false);
		});
	});

	describe("S3 request parameters", () => {
		it("should request only first 16 bytes", async () => {
			const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield pdfBytes;
					},
				},
			});

			await validateFileContent("test-key", "application/pdf");

			expect(mockS3Send).toHaveBeenCalledWith(
				expect.objectContaining({
					input: expect.objectContaining({
						Range: "bytes=0-15",
					}),
				}),
			);
		});

		it("should use correct bucket and key", async () => {
			const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield pdfBytes;
					},
				},
			});

			await validateFileContent("path/to/file.pdf", "application/pdf");

			expect(mockS3Send).toHaveBeenCalledWith(
				expect.objectContaining({
					input: expect.objectContaining({
						Bucket: "test-bucket",
						Key: "path/to/file.pdf",
					}),
				}),
			);
		});
	});

	describe("multiple chunks", () => {
		it("should combine multiple chunks correctly", async () => {
			// Split PDF magic number across chunks
			mockS3Send.mockResolvedValue({
				Body: {
					[Symbol.asyncIterator]: async function* () {
						yield new Uint8Array([0x25, 0x50]); // %P
						yield new Uint8Array([0x44, 0x46]); // DF
					},
				},
			});

			const result = await validateFileContent("test-key", "application/pdf");

			expect(result.valid).toBe(true);
			expect(result.detectedType).toBe("application/pdf");
		});
	});
});

// biome-ignore-all lint/suspicious/noExplicitAny: Disable linter for now
// biome-ignore-all lint/style/noNonNullAssertion: Disable linter for now
import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePresignedUpload } from "../use-presigned-upload";

// Mock dependencies
vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
	},
}));

vi.mock("@/trpc/react", () => ({
	api: {
		attachment: {
			requestUploadUrl: {
				useMutation: vi.fn(),
			},
			confirmUpload: {
				useMutation: vi.fn(),
			},
		},
	},
}));

// Mock XMLHttpRequest
class MockXMLHttpRequest {
	upload = {
		addEventListener: vi.fn(),
	};
	addEventListener = vi.fn();
	open = vi.fn();
	setRequestHeader = vi.fn();
	send = vi.fn();
	status = 200;
	statusText = "OK";
}

describe("usePresignedUpload", () => {
	let mockRequestUrl: any;
	let mockConfirmUpload: any;
	let originalXMLHttpRequest: any;

	beforeEach(async () => {
		const { api } = await import("@/trpc/react");

		mockRequestUrl = {
			mutateAsync: vi.fn(),
			isPending: false,
		};

		mockConfirmUpload = {
			mutateAsync: vi.fn(),
			isPending: false,
		};

		vi
			.mocked(api.attachment.requestUploadUrl.useMutation)
			.mockReturnValue(mockRequestUrl);
		vi
			.mocked(api.attachment.confirmUpload.useMutation)
			.mockReturnValue(mockConfirmUpload);

		// Mock XMLHttpRequest
		originalXMLHttpRequest = global.XMLHttpRequest;
		global.XMLHttpRequest = MockXMLHttpRequest as any;

		vi.clearAllMocks();
	});

	afterEach(() => {
		global.XMLHttpRequest = originalXMLHttpRequest;
		vi.clearAllTimers();
	});

	describe("uploadFile", () => {
		it("should successfully upload a file", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync.mockResolvedValue({
				uploadUrl: "https://s3.aws.com/presigned-url",
				attachmentId: "att123",
				key: "attachments/private/org/report/file.pdf",
			});

			mockConfirmUpload.mutateAsync.mockResolvedValue({ success: true });

			const file = new File(["content"], "test.pdf", {
				type: "application/pdf",
			});

			let uploadPromise: Promise<string>;

			act(() => {
				uploadPromise = result.current.uploadFile(file);
			});

			// Simulate XHR success
			await waitFor(() => {
				const xhr = MockXMLHttpRequest.prototype as any;
				const loadCallback = xhr.addEventListener.mock.calls.find(
					(call: any) => call[0] === "load",
				)?.[1];
				if (loadCallback) loadCallback();
			});

			const attachmentId = await uploadPromise!;

			expect(attachmentId).toBe("att123");
			expect(mockRequestUrl.mutateAsync).toHaveBeenCalledWith({
				reportId: "report123",
				organizationId: undefined,
				fileName: "test.pdf",
				fileSize: 7,
				contentType: "application/pdf",
				visibility: undefined,
			});
			expect(mockConfirmUpload.mutateAsync).toHaveBeenCalledWith({
				attachmentId: "att123",
				key: "attachments/private/org/report/file.pdf",
			});
		});

		it("should track upload progress", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync.mockResolvedValue({
				uploadUrl: "https://s3.aws.com/presigned-url",
				attachmentId: "att123",
				key: "key",
			});

			const file = new File(["content"], "test.pdf", {
				type: "application/pdf",
			});

			act(() => {
				result.current.uploadFile(file);
			});

			// Check initial state
			await waitFor(() => {
				expect(result.current.uploading.size).toBeGreaterThan(0);
			});

			// Simulate progress event
			await waitFor(() => {
				const xhr = MockXMLHttpRequest.prototype as any;
				const progressCallback = xhr.upload.addEventListener.mock.calls.find(
					(call: any) => call[0] === "progress",
				)?.[1];

				if (progressCallback) {
					progressCallback({
						lengthComputable: true,
						loaded: 50,
						total: 100,
					});
				}
			});

			// Check progress updated
			await waitFor(() => {
				const uploadState = Array.from(result.current.uploading.values())[0];
				expect(uploadState?.progress).toBe(50);
			});
		});

		it("should handle upload errors", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync.mockRejectedValue(new Error("Network error"));

			const file = new File(["content"], "test.pdf", {
				type: "application/pdf",
			});

			await expect(act(() => result.current.uploadFile(file))).rejects.toThrow(
				"Network error",
			);

			expect(toast.error).toHaveBeenCalledWith("Upload failed", {
				description: "Network error",
			});
		});

		it("should handle S3 upload failure", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync.mockResolvedValue({
				uploadUrl: "https://s3.aws.com/presigned-url",
				attachmentId: "att123",
				key: "key",
			});

			const file = new File(["content"], "test.pdf", {
				type: "application/pdf",
			});

			let uploadPromise: Promise<string>;

			act(() => {
				uploadPromise = result.current.uploadFile(file);
			});

			// Simulate XHR error
			await waitFor(() => {
				const xhr = MockXMLHttpRequest.prototype as any;
				xhr.status = 403;
				xhr.statusText = "Forbidden";

				const loadCallback = xhr.addEventListener.mock.calls.find(
					(call: any) => call[0] === "load",
				)?.[1];
				if (loadCallback) loadCallback();
			});

			await expect(uploadPromise!).rejects.toThrow();
		});

		it("should handle confirmation failure", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync.mockResolvedValue({
				uploadUrl: "https://s3.aws.com/presigned-url",
				attachmentId: "att123",
				key: "key",
			});

			mockConfirmUpload.mutateAsync.mockRejectedValue(
				new Error("File not found in S3"),
			);

			const file = new File(["content"], "test.pdf", {
				type: "application/pdf",
			});

			let uploadPromise: Promise<string>;

			act(() => {
				uploadPromise = result.current.uploadFile(file);
			});

			// Simulate XHR success
			await waitFor(() => {
				const xhr = MockXMLHttpRequest.prototype as any;
				const loadCallback = xhr.addEventListener.mock.calls.find(
					(call: any) => call[0] === "load",
				)?.[1];
				if (loadCallback) loadCallback();
			});

			await expect(uploadPromise!).rejects.toThrow("File not found in S3");
		});

		it("should clean up upload state after success", async () => {
			vi.useFakeTimers();

			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync.mockResolvedValue({
				uploadUrl: "https://s3.aws.com/presigned-url",
				attachmentId: "att123",
				key: "key",
			});

			mockConfirmUpload.mutateAsync.mockResolvedValue({ success: true });

			const file = new File(["content"], "test.pdf", {
				type: "application/pdf",
			});

			act(() => {
				result.current.uploadFile(file);
			});

			// Simulate XHR success
			await waitFor(() => {
				const xhr = MockXMLHttpRequest.prototype as any;
				const loadCallback = xhr.addEventListener.mock.calls.find(
					(call: any) => call[0] === "load",
				)?.[1];
				if (loadCallback) loadCallback();
			});

			// Wait for cleanup timeout (2 seconds)
			act(() => {
				vi.advanceTimersByTime(2000);
			});

			await waitFor(() => {
				expect(result.current.uploading.size).toBe(0);
			});

			vi.useRealTimers();
		});

		it("should clean up upload state after error", async () => {
			vi.useFakeTimers();

			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync.mockRejectedValue(new Error("Test error"));

			const file = new File(["content"], "test.pdf", {
				type: "application/pdf",
			});

			await act(async () => {
				try {
					await result.current.uploadFile(file);
				} catch (_e) {
					// Expected error
				}
			});

			// Wait for cleanup timeout (5 seconds)
			act(() => {
				vi.advanceTimersByTime(5000);
			});

			await waitFor(() => {
				expect(result.current.uploading.size).toBe(0);
			});

			vi.useRealTimers();
		});
	});

	describe("uploadFiles", () => {
		it("should upload multiple files in parallel", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync
				.mockResolvedValueOnce({
					uploadUrl: "url1",
					attachmentId: "att1",
					key: "key1",
				})
				.mockResolvedValueOnce({
					uploadUrl: "url2",
					attachmentId: "att2",
					key: "key2",
				});

			mockConfirmUpload.mutateAsync.mockResolvedValue({ success: true });

			const files = [
				new File(["content1"], "file1.pdf", { type: "application/pdf" }),
				new File(["content2"], "file2.pdf", { type: "application/pdf" }),
			];

			let uploadPromise: Promise<string[]>;

			act(() => {
				uploadPromise = result.current.uploadFiles(files);
			});

			// Simulate XHR success for all files
			await waitFor(() => {
				const xhr = MockXMLHttpRequest.prototype as any;
				const loadCallback = xhr.addEventListener.mock.calls.find(
					(call: any) => call[0] === "load",
				)?.[1];
				if (loadCallback) {
					loadCallback();
					loadCallback(); // Call twice for 2 files
				}
			});

			const attachmentIds = await uploadPromise!;

			expect(attachmentIds).toEqual(["att1", "att2"]);
			expect(mockRequestUrl.mutateAsync).toHaveBeenCalledTimes(2);
		});

		it("should handle partial failures", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync
				.mockResolvedValueOnce({
					uploadUrl: "url1",
					attachmentId: "att1",
					key: "key1",
				})
				.mockRejectedValueOnce(new Error("Upload failed"));

			mockConfirmUpload.mutateAsync.mockResolvedValue({ success: true });

			const files = [
				new File(["content1"], "file1.pdf", { type: "application/pdf" }),
				new File(["content2"], "file2.pdf", { type: "application/pdf" }),
			];

			let uploadPromise: Promise<string[]>;

			act(() => {
				uploadPromise = result.current.uploadFiles(files);
			});

			// Simulate XHR success for first file
			await waitFor(() => {
				const xhr = MockXMLHttpRequest.prototype as any;
				const loadCallback = xhr.addEventListener.mock.calls.find(
					(call: any) => call[0] === "load",
				)?.[1];
				if (loadCallback) loadCallback();
			});

			const attachmentIds = await uploadPromise!;

			expect(attachmentIds).toEqual(["att1"]);
			expect(toast.error).toHaveBeenCalledWith(
				"1 file(s) failed to upload",
				expect.objectContaining({
					description: "file2.pdf",
				}),
			);
		});

		it("should show error toast with all failed filenames", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync.mockRejectedValue(new Error("All failed"));

			const files = [
				new File(["1"], "file1.pdf", { type: "application/pdf" }),
				new File(["2"], "file2.pdf", { type: "application/pdf" }),
			];

			await act(() => result.current.uploadFiles(files));

			expect(toast.error).toHaveBeenCalledWith(
				"2 file(s) failed to upload",
				expect.objectContaining({
					description: "file1.pdf, file2.pdf",
				}),
			);
		});
	});

	describe("upload state management", () => {
		it("should track isUploading state", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			expect(result.current.isUploading).toBe(false);

			mockRequestUrl.mutateAsync.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(
							() =>
								resolve({
									uploadUrl: "url",
									attachmentId: "att",
									key: "key",
								}),
							100,
						);
					}),
			);

			const file = new File(["content"], "test.pdf", {
				type: "application/pdf",
			});

			act(() => {
				result.current.uploadFile(file);
			});

			await waitFor(() => {
				expect(result.current.isUploading).toBe(true);
			});
		});

		it("should update progress through different stages", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report123" }),
			);

			mockRequestUrl.mutateAsync.mockResolvedValue({
				uploadUrl: "url",
				attachmentId: "att",
				key: "key",
			});

			mockConfirmUpload.mutateAsync.mockResolvedValue({ success: true });

			const file = new File(["content"], "test.pdf", {
				type: "application/pdf",
			});

			act(() => {
				result.current.uploadFile(file);
			});

			// Should go through: requesting -> uploading -> confirming -> success
			await waitFor(() => {
				const uploadState = Array.from(result.current.uploading.values())[0];
				expect(uploadState?.status).toBe("requesting");
			});
		});
	});

	describe("options", () => {
		it("should pass visibility option to API", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({
					organizationId: "org123",
					visibility: "PUBLIC",
				}),
			);

			mockRequestUrl.mutateAsync.mockResolvedValue({
				uploadUrl: "url",
				attachmentId: "att",
				key: "key",
			});

			mockConfirmUpload.mutateAsync.mockResolvedValue({ success: true });

			const file = new File(["logo"], "logo.png", { type: "image/png" });

			act(() => {
				result.current.uploadFile(file);
			});

			await waitFor(() => {
				expect(mockRequestUrl.mutateAsync).toHaveBeenCalledWith(
					expect.objectContaining({
						organizationId: "org123",
						visibility: "PUBLIC",
					}),
				);
			});
		});

		it("should pass reportId option to API", async () => {
			const { result } = renderHook(() =>
				usePresignedUpload({ reportId: "report456" }),
			);

			mockRequestUrl.mutateAsync.mockResolvedValue({
				uploadUrl: "url",
				attachmentId: "att",
				key: "key",
			});

			const file = new File(["content"], "file.pdf", {
				type: "application/pdf",
			});

			act(() => {
				result.current.uploadFile(file);
			});

			await waitFor(() => {
				expect(mockRequestUrl.mutateAsync).toHaveBeenCalledWith(
					expect.objectContaining({
						reportId: "report456",
					}),
				);
			});
		});
	});
});

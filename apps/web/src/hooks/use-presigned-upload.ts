import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";

interface UploadOptions {
	reportId?: string;
	organizationId?: string;
	visibility?: "PRIVATE" | "PUBLIC";
}

interface UploadProgress {
	status: "requesting" | "uploading" | "confirming" | "success" | "error";
	progress: number;
}

export function usePresignedUpload(options: UploadOptions = {}) {
	const [uploading, setUploading] = useState<Map<string, UploadProgress>>(
		new Map(),
	);

	const requestUrl = api.attachment.requestUploadUrl.useMutation();
	const confirmUpload = api.attachment.confirmUpload.useMutation();

	const uploadFile = async (file: File): Promise<string> => {
		const fileId = `${file.name}-${Date.now()}`;

		try {
			setUploading((prev) =>
				new Map(prev).set(fileId, {
					status: "requesting",
					progress: 0,
				}),
			);

			// Step 1: Request presigned URL
			const { uploadUrl, attachmentId, key } = await requestUrl.mutateAsync({
				reportId: options.reportId,
				organizationId: options.organizationId,
				fileName: file.name,
				fileSize: file.size,
				contentType: file.type,
				visibility: options.visibility,
			});

			setUploading((prev) =>
				new Map(prev).set(fileId, {
					status: "uploading",
					progress: 0,
				}),
			);

			// Step 2: Upload to S3 with progress tracking
			await new Promise<void>((resolve, reject) => {
				const xhr = new XMLHttpRequest();

				// Track upload progress
				xhr.upload.addEventListener("progress", (event) => {
					if (event.lengthComputable) {
						const percentComplete = Math.round((event.loaded / event.total) * 100);
						setUploading((prev) =>
							new Map(prev).set(fileId, {
								status: "uploading",
								progress: percentComplete,
							}),
						);
					}
				});

				// Handle completion
				xhr.addEventListener("load", () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						resolve();
					} else {
						reject(
							new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`),
						);
					}
				});

				// Handle errors
				xhr.addEventListener("error", () => {
					reject(new Error("Network error during upload"));
				});

				xhr.addEventListener("abort", () => {
					reject(new Error("Upload aborted"));
				});

				// Start upload
				xhr.open("PUT", uploadUrl);
				xhr.setRequestHeader("Content-Type", file.type);
				xhr.send(file);
			});

			setUploading((prev) =>
				new Map(prev).set(fileId, {
					status: "confirming",
					progress: 90,
				}),
			);

			// Step 3: Confirm upload
			await confirmUpload.mutateAsync({ attachmentId, key });

			setUploading((prev) =>
				new Map(prev).set(fileId, {
					status: "success",
					progress: 100,
				}),
			);

			// Clear from map after 2 seconds to prevent memory leak
			setTimeout(() => {
				setUploading((prev) => {
					const next = new Map(prev);
					next.delete(fileId);
					return next;
				});
			}, 2000);

			return attachmentId;
		} catch (error) {
			setUploading((prev) =>
				new Map(prev).set(fileId, {
					status: "error",
					progress: 0,
				}),
			);

			// Clear error state after 5 seconds
			setTimeout(() => {
				setUploading((prev) => {
					const next = new Map(prev);
					next.delete(fileId);
					return next;
				});
			}, 5000);

			if (error instanceof Error) {
				toast.error("Upload failed", { description: error.message });
			}
			throw error;
		}
	};

	const uploadFiles = async (files: File[]): Promise<string[]> => {
		const results = await Promise.allSettled(
			files.map((file) => uploadFile(file)),
		);

		const attachmentIds: string[] = [];
		const failures: string[] = [];

		results.forEach((result, idx) => {
			if (result.status === "fulfilled") {
				attachmentIds.push(result.value);
			} else {
				failures.push(files[idx]?.name ?? "unknown");
			}
		});

		if (failures.length > 0) {
			toast.error(`${failures.length} file(s) failed to upload`, {
				description: failures.join(", "),
			});
		}

		return attachmentIds;
	};

	return {
		uploadFile,
		uploadFiles,
		uploading,
		isUploading: uploading.size > 0,
	};
}

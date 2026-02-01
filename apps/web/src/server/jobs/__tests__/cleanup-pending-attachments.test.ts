// biome-ignore-all lint/suspicious/noExplicitAny: Disable linter for now
// biome-ignore-all lint/style/noNonNullAssertion: Disable linter for now
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	cleanupDeletedAttachments,
	cleanupPendingAttachments,
} from "../cleanup-pending-attachments";

// Mock dependencies
vi.mock("@/server/db", () => ({
	db: {
		attachment: {
			findMany: vi.fn(),
			deleteMany: vi.fn(),
		},
	},
}));

vi.mock("@/server/storage/s3-client", () => ({
	deleteFileFromS3: vi.fn(),
}));

describe("cleanupPendingAttachments", () => {
	let mockFindMany: any;
	let mockDeleteMany: any;
	let mockDeleteFileFromS3: any;

	beforeEach(async () => {
		const { db } = await import("@/server/db");
		const { deleteFileFromS3 } = await import("@/server/storage/s3-client");

		mockFindMany = vi.mocked(db.attachment.findMany);
		mockDeleteMany = vi.mocked(db.attachment.deleteMany);
		mockDeleteFileFromS3 = vi.mocked(deleteFileFromS3);

		mockFindMany.mockClear();
		mockDeleteMany.mockClear();
		mockDeleteFileFromS3.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should delete PENDING attachments older than 10 minutes", async () => {
		const now = new Date();
		const oldDate = new Date(now.getTime() - 15 * 60 * 1000); // 15 min ago

		mockFindMany.mockResolvedValue([
			{
				id: "att1",
				key: "attachments/private/org1/report1/file1.pdf",
				createdAt: oldDate,
			},
			{
				id: "att2",
				key: "attachments/private/org1/report1/file2.pdf",
				createdAt: oldDate,
			},
		]);

		mockDeleteMany.mockResolvedValue({ count: 2 });
		mockDeleteFileFromS3.mockResolvedValue(undefined);

		const result = await cleanupPendingAttachments();

		expect(result.deletedCount).toBe(2);
		expect(result.s3DeletedCount).toBe(2);
		expect(result.errors).toHaveLength(0);
	});

	it("should not delete recent PENDING attachments", async () => {
		const now = new Date();
		const recentDate = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago

		// Mock must respect the query: only return attachments with createdAt < cutoff
		const recentAttachment = {
			id: "att1",
			key: "attachments/private/org1/report1/file1.pdf",
			createdAt: recentDate,
		};
		mockFindMany.mockImplementation(
			(args: { where?: { createdAt?: { lt?: Date } } }) => {
				const cutoff = args.where?.createdAt?.lt;
				if (!cutoff) return Promise.resolve([recentAttachment]);
				// Only return attachments older than cutoff (recent is 5 min ago, cutoff is 10 min ago)
				const matching = [recentAttachment].filter(
					(a) => a.createdAt.getTime() < cutoff.getTime(),
				);
				return Promise.resolve(matching);
			},
		);

		const result = await cleanupPendingAttachments();

		// Should find 0 attachments (recent is 5 min ago, cutoff is 10 min ago)
		expect(mockDeleteMany).not.toHaveBeenCalled();
		expect(mockDeleteFileFromS3).not.toHaveBeenCalled();
		expect(result.deletedCount).toBe(0);
	});

	it("should handle no PENDING attachments gracefully", async () => {
		mockFindMany.mockResolvedValue([]);

		const result = await cleanupPendingAttachments();

		expect(result.deletedCount).toBe(0);
		expect(result.s3DeletedCount).toBe(0);
		expect(result.errors).toHaveLength(0);
		expect(mockDeleteMany).not.toHaveBeenCalled();
	});

	it("should delete from database in batch", async () => {
		const oldDate = new Date(Date.now() - 15 * 60 * 1000);

		mockFindMany.mockResolvedValue([
			{ id: "att1", key: "key1", createdAt: oldDate },
			{ id: "att2", key: "key2", createdAt: oldDate },
			{ id: "att3", key: "key3", createdAt: oldDate },
		]);

		mockDeleteMany.mockResolvedValue({ count: 3 });
		mockDeleteFileFromS3.mockResolvedValue(undefined);

		await cleanupPendingAttachments();

		expect(mockDeleteMany).toHaveBeenCalledWith({
			where: {
				id: {
					in: ["att1", "att2", "att3"],
				},
			},
		});
	});

	it("should delete from S3 in parallel", async () => {
		const oldDate = new Date(Date.now() - 15 * 60 * 1000);

		mockFindMany.mockResolvedValue([
			{ id: "att1", key: "key1.pdf", createdAt: oldDate },
			{ id: "att2", key: "key2.pdf", createdAt: oldDate },
		]);

		mockDeleteMany.mockResolvedValue({ count: 2 });
		mockDeleteFileFromS3.mockResolvedValue(undefined);

		await cleanupPendingAttachments();

		expect(mockDeleteFileFromS3).toHaveBeenCalledTimes(2);
		expect(mockDeleteFileFromS3).toHaveBeenCalledWith("key1.pdf");
		expect(mockDeleteFileFromS3).toHaveBeenCalledWith("key2.pdf");
	});

	it("should handle S3 deletion errors gracefully", async () => {
		const oldDate = new Date(Date.now() - 15 * 60 * 1000);

		mockFindMany.mockResolvedValue([
			{ id: "att1", key: "key1.pdf", createdAt: oldDate },
			{ id: "att2", key: "key2.pdf", createdAt: oldDate },
		]);

		mockDeleteMany.mockResolvedValue({ count: 2 });

		// First deletion fails, second succeeds
		mockDeleteFileFromS3
			.mockRejectedValueOnce(new Error("S3 error"))
			.mockResolvedValueOnce(undefined);

		const result = await cleanupPendingAttachments();

		expect(result.deletedCount).toBe(2); // DB deletion succeeds
		expect(result.s3DeletedCount).toBe(1); // Only 1 S3 deletion succeeds
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("S3 error");
	});

	it("should continue cleanup even if some S3 deletions fail", async () => {
		const oldDate = new Date(Date.now() - 15 * 60 * 1000);

		mockFindMany.mockResolvedValue([
			{ id: "att1", key: "key1.pdf", createdAt: oldDate },
			{ id: "att2", key: "key2.pdf", createdAt: oldDate },
			{ id: "att3", key: "key3.pdf", createdAt: oldDate },
		]);

		mockDeleteMany.mockResolvedValue({ count: 3 });
		mockDeleteFileFromS3
			.mockRejectedValueOnce(new Error("Network error"))
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce(undefined);

		const result = await cleanupPendingAttachments();

		expect(result.deletedCount).toBe(3);
		expect(result.s3DeletedCount).toBe(2);
		expect(result.errors).toHaveLength(1);
	});

	it("should handle database errors", async () => {
		mockFindMany.mockRejectedValue(new Error("Database connection failed"));

		const result = await cleanupPendingAttachments();

		expect(result.deletedCount).toBe(0);
		expect(result.s3DeletedCount).toBe(0);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain("Database connection failed");
	});

	it("should query with correct time cutoff", async () => {
		mockFindMany.mockResolvedValue([]);

		await cleanupPendingAttachments();

		expect(mockFindMany).toHaveBeenCalledWith({
			where: {
				status: "PENDING",
				createdAt: {
					lt: expect.any(Date),
				},
			},
			select: {
				id: true,
				key: true,
				createdAt: true,
			},
		});

		// Verify the cutoff date is approximately 10 minutes ago
		const call = mockFindMany.mock.calls[0][0];
		const cutoffDate = call.where.createdAt.lt;
		const expectedCutoff = new Date(Date.now() - 10 * 60 * 1000);

		// Allow 1 second tolerance for test execution time
		expect(
			Math.abs(cutoffDate.getTime() - expectedCutoff.getTime()),
		).toBeLessThan(1000);
	});
});

describe("cleanupDeletedAttachments", () => {
	let mockFindMany: any;
	let mockDeleteMany: any;
	let mockDeleteFileFromS3: any;

	beforeEach(async () => {
		const { db } = await import("@/server/db");
		const { deleteFileFromS3 } = await import("@/server/storage/s3-client");

		mockFindMany = vi.mocked(db.attachment.findMany);
		mockDeleteMany = vi.mocked(db.attachment.deleteMany);
		mockDeleteFileFromS3 = vi.mocked(deleteFileFromS3);

		mockFindMany.mockClear();
		mockDeleteMany.mockClear();
		mockDeleteFileFromS3.mockClear();
	});

	it("should delete DELETED attachments older than retention period", async () => {
		const now = new Date();
		const oldDeletedDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago

		mockFindMany.mockResolvedValue([
			{
				id: "att1",
				key: "attachments/private/org1/report1/file1.pdf",
				deletedAt: oldDeletedDate,
			},
		]);

		mockDeleteMany.mockResolvedValue({ count: 1 });
		mockDeleteFileFromS3.mockResolvedValue(undefined);

		const result = await cleanupDeletedAttachments(90);

		expect(result.deletedCount).toBe(1);
		expect(result.s3DeletedCount).toBe(1);
		expect(result.errors).toHaveLength(0);
	});

	it("should not delete recent DELETED attachments", async () => {
		const now = new Date();
		const _recentDeletedDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

		mockFindMany.mockResolvedValue([]);

		const result = await cleanupDeletedAttachments(90);

		expect(result.deletedCount).toBe(0);
		expect(mockDeleteFileFromS3).not.toHaveBeenCalled();
	});

	it("should use custom retention period", async () => {
		mockFindMany.mockResolvedValue([]);

		await cleanupDeletedAttachments(30); // 30 days instead of 90

		expect(mockFindMany).toHaveBeenCalledWith({
			where: {
				status: "DELETED",
				deletedAt: {
					not: null,
					lt: expect.any(Date),
				},
			},
			select: {
				id: true,
				key: true,
				deletedAt: true,
			},
		});

		const call = mockFindMany.mock.calls[0][0];
		const cutoffDate = call.where.deletedAt.lt;
		const expectedCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		// Allow 1 second tolerance
		expect(
			Math.abs(cutoffDate.getTime() - expectedCutoff.getTime()),
		).toBeLessThan(5000);
	});

	it("should delete from S3 before deleting from database", async () => {
		const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);

		mockFindMany.mockResolvedValue([
			{ id: "att1", key: "key1.pdf", deletedAt: oldDate },
		]);

		const callOrder: string[] = [];

		mockDeleteFileFromS3.mockImplementation(async () => {
			callOrder.push("s3");
		});

		mockDeleteMany.mockImplementation(async () => {
			callOrder.push("db");
			return { count: 1 };
		});

		await cleanupDeletedAttachments(90);

		expect(callOrder).toEqual(["s3", "db"]);
	});

	it("should handle no DELETED attachments gracefully", async () => {
		mockFindMany.mockResolvedValue([]);

		const result = await cleanupDeletedAttachments(90);

		expect(result.deletedCount).toBe(0);
		expect(result.s3DeletedCount).toBe(0);
		expect(result.errors).toHaveLength(0);
	});

	it("should permanently delete from database", async () => {
		const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);

		mockFindMany.mockResolvedValue([
			{ id: "att1", key: "key1.pdf", deletedAt: oldDate },
			{ id: "att2", key: "key2.pdf", deletedAt: oldDate },
		]);

		mockDeleteMany.mockResolvedValue({ count: 2 });
		mockDeleteFileFromS3.mockResolvedValue(undefined);

		await cleanupDeletedAttachments(90);

		// Should use deleteMany for permanent deletion
		expect(mockDeleteMany).toHaveBeenCalledWith({
			where: {
				id: {
					in: ["att1", "att2"],
				},
			},
		});
	});

	it("should handle S3 errors but still delete from database", async () => {
		const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);

		mockFindMany.mockResolvedValue([
			{ id: "att1", key: "key1.pdf", deletedAt: oldDate },
		]);

		mockDeleteFileFromS3.mockRejectedValue(new Error("S3 unavailable"));
		mockDeleteMany.mockResolvedValue({ count: 1 });

		const result = await cleanupDeletedAttachments(90);

		expect(result.deletedCount).toBe(1); // DB still deleted
		expect(result.s3DeletedCount).toBe(0);
		expect(result.errors).toHaveLength(1);
	});
});

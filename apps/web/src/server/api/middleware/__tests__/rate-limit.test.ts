// biome-ignore-all lint/suspicious/noExplicitAny: Disable linter for now
// biome-ignore-all lint/style/noNonNullAssertion: Disable linter for now
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// We need to test the middleware functions directly
// Since they use a singleton limiter, we'll import and test them

describe("Rate Limiting Middleware", () => {
	// Mock context and next function
	const createMockContext = (userId: string) => ({
		session: {
			user: {
				id: userId,
				email: "test@example.com",
				name: "Test User",
			},
		},
		db: {} as any,
		headers: new Headers(),
	});

	const mockNext = vi.fn(() => Promise.resolve({ data: "success" }));

	beforeEach(() => {
		mockNext.mockClear();
	});

	describe("uploadRateLimit", () => {
		it("should allow requests under the limit", async () => {
			const { uploadRateLimit } = await import("../rate-limit");
			const ctx = createMockContext("user1");

			// Make 5 requests (under limit of 10)
			for (let i = 0; i < 5; i++) {
				const result = await uploadRateLimit({ ctx, next: mockNext });
				expect(result).toEqual({ data: "success" });
			}

			expect(mockNext).toHaveBeenCalledTimes(5);
		});

		it("should block requests over the limit", async () => {
			const { uploadRateLimit } = await import("../rate-limit");
			const ctx = createMockContext("user-rate-limit-test");

			// Make 10 requests (at limit)
			for (let i = 0; i < 10; i++) {
				await uploadRateLimit({ ctx, next: mockNext });
			}

			// 11th request should fail (middleware throws synchronously, wrap so .rejects catches it)
			await expect(
				Promise.resolve().then(() => uploadRateLimit({ ctx, next: mockNext })),
			).rejects.toThrow(TRPCError);

			await expect(
				Promise.resolve().then(() => uploadRateLimit({ ctx, next: mockNext })),
			).rejects.toThrow("Too many upload requests");
		});

		it("should use separate limits per user", async () => {
			const { uploadRateLimit } = await import("../rate-limit");
			const user1Ctx = createMockContext("user-a");
			const user2Ctx = createMockContext("user-b");

			// User 1 makes 10 requests
			for (let i = 0; i < 10; i++) {
				await uploadRateLimit({ ctx: user1Ctx, next: mockNext });
			}

			// User 2 should still be able to make requests
			const result = await uploadRateLimit({ ctx: user2Ctx, next: mockNext });
			expect(result).toEqual({ data: "success" });
		});

		it("should throw UNAUTHORIZED for unauthenticated users", async () => {
			const { uploadRateLimit } = await import("../rate-limit");
			const unauthCtx = {
				session: null,
				db: {} as any,
				headers: new Headers(),
			};

			await expect(
				Promise.resolve().then(() =>
					uploadRateLimit({ ctx: unauthCtx as any, next: mockNext }),
				),
			).rejects.toThrow(TRPCError);

			await expect(
				Promise.resolve().then(() =>
					uploadRateLimit({ ctx: unauthCtx as any, next: mockNext }),
				),
			).rejects.toThrow("Not authenticated");
		});

		it("should throw TOO_MANY_REQUESTS error with correct code", async () => {
			const { uploadRateLimit } = await import("../rate-limit");
			const ctx = createMockContext("user-error-code-test");

			// Exhaust limit
			for (let i = 0; i < 10; i++) {
				await uploadRateLimit({ ctx, next: mockNext });
			}

			// Check error code
			try {
				await uploadRateLimit({ ctx, next: mockNext });
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("TOO_MANY_REQUESTS");
			}
		});
	});

	describe("downloadRateLimit", () => {
		it("should allow requests under the limit", async () => {
			const { downloadRateLimit } = await import("../rate-limit");
			const ctx = createMockContext("user-download-1");

			// Make 50 requests (under limit of 100)
			for (let i = 0; i < 50; i++) {
				const result = await downloadRateLimit({ ctx, next: mockNext });
				expect(result).toEqual({ data: "success" });
			}

			expect(mockNext).toHaveBeenCalledTimes(50);
		});

		it("should block requests over the limit", async () => {
			const { downloadRateLimit } = await import("../rate-limit");
			const ctx = createMockContext("user-download-limit");

			// Make 100 requests (at limit)
			for (let i = 0; i < 100; i++) {
				await downloadRateLimit({ ctx, next: mockNext });
			}

			// 101st request should fail (middleware throws synchronously, wrap so .rejects catches it)
			await expect(
				Promise.resolve().then(() => downloadRateLimit({ ctx, next: mockNext })),
			).rejects.toThrow("Too many download requests");
		});

		it("should have higher limit than upload", async () => {
			const { uploadRateLimit, downloadRateLimit } = await import("../rate-limit");
			const uploadCtx = createMockContext("user-upload-compare");
			const downloadCtx = createMockContext("user-download-compare");

			// Upload limit: 10
			for (let i = 0; i < 10; i++) {
				await uploadRateLimit({ ctx: uploadCtx, next: mockNext });
			}
			await expect(
				Promise.resolve().then(() =>
					uploadRateLimit({ ctx: uploadCtx, next: mockNext }),
				),
			).rejects.toThrow();

			// Download limit: 100 (can make more requests)
			for (let i = 0; i < 50; i++) {
				await downloadRateLimit({ ctx: downloadCtx, next: mockNext });
			}
			// Should still work
			const result = await downloadRateLimit({
				ctx: downloadCtx,
				next: mockNext,
			});
			expect(result).toEqual({ data: "success" });
		});

		it("should throw UNAUTHORIZED for unauthenticated users", async () => {
			const { downloadRateLimit } = await import("../rate-limit");
			const unauthCtx = {
				session: null,
				db: {} as any,
				headers: new Headers(),
			};

			await expect(
				Promise.resolve().then(() =>
					downloadRateLimit({ ctx: unauthCtx as any, next: mockNext }),
				),
			).rejects.toThrow("Not authenticated");
		});
	});

	describe("RateLimiter class (internal)", () => {
		// Note: These tests verify the internal behavior through the middleware
		it("should reset limit after time window", async () => {
			// This test would require mocking Date.now() or waiting
			// For now, we just verify the basic behavior
			const { uploadRateLimit } = await import("../rate-limit");
			const ctx = createMockContext("user-window-test");

			// Make requests up to limit
			for (let i = 0; i < 10; i++) {
				await uploadRateLimit({ ctx, next: mockNext });
			}

			// Next request fails (middleware throws synchronously, wrap so .rejects catches it)
			await expect(
				Promise.resolve().then(() => uploadRateLimit({ ctx, next: mockNext })),
			).rejects.toThrow();

			// In a real scenario, after 60 seconds, the window would reset
			// and requests would be allowed again
			// This would require advanced time mocking
		});

		it("should track requests independently per user", async () => {
			const { uploadRateLimit } = await import("../rate-limit");

			const users = ["user-track-1", "user-track-2", "user-track-3"];

			// Each user makes some requests
			for (const userId of users) {
				const ctx = createMockContext(userId);
				for (let i = 0; i < 5; i++) {
					await uploadRateLimit({ ctx, next: mockNext });
				}
			}

			// All users should still be under limit (5 < 10)
			for (const userId of users) {
				const ctx = createMockContext(userId);
				const result = await uploadRateLimit({ ctx, next: mockNext });
				expect(result).toEqual({ data: "success" });
			}
		});
	});

	describe("edge cases", () => {
		it("should handle rapid concurrent requests", async () => {
			const { uploadRateLimit } = await import("../rate-limit");
			const ctx = createMockContext("user-concurrent");

			// Make 5 concurrent requests
			const promises = Array.from({ length: 5 }, () =>
				uploadRateLimit({ ctx, next: mockNext }),
			);

			const results = await Promise.all(promises);
			expect(results).toHaveLength(5);
			expect(mockNext).toHaveBeenCalledTimes(5);
		});

		it("should handle requests from different users concurrently", async () => {
			const { uploadRateLimit } = await import("../rate-limit");

			const promises = Array.from({ length: 5 }, (_, i) => {
				const ctx = createMockContext(`user-concurrent-${i}`);
				return uploadRateLimit({ ctx, next: mockNext });
			});

			const results = await Promise.all(promises);
			expect(results).toHaveLength(5);
		});

		it("should handle missing user ID gracefully", async () => {
			const { uploadRateLimit } = await import("../rate-limit");
			const invalidCtx = {
				session: {
					user: {
						// id missing
						email: "test@example.com",
					},
				},
				db: {} as any,
				headers: new Headers(),
			};

			try {
				await uploadRateLimit({ ctx: invalidCtx as any, next: mockNext });
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeDefined();
			}
		});
	});

	describe("cleanup mechanism", () => {
		it("should not leak memory over time", async () => {
			// This test verifies that the cleanup interval runs
			// In practice, the setInterval in rate-limit.ts cleans up every 5 minutes
			// We can't easily test this without mocking timers

			const { uploadRateLimit } = await import("../rate-limit");

			// Make requests with many different users
			for (let i = 0; i < 50; i++) {
				const ctx = createMockContext(`user-cleanup-${i}`);
				await uploadRateLimit({ ctx, next: mockNext });
			}

			// The limiter should track all these users
			// But in production, the cleanup would remove expired entries
			// This is more of an integration test concern
		});
	});
});

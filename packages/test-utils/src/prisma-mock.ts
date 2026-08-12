import type { PrismaClient } from "@zemio/db";
import { type DeepMockProxy, mockDeep } from "vitest-mock-extended";

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export function createMockDb(): MockPrismaClient {
	return mockDeep<PrismaClient>();
}

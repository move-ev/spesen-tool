import type { PrismaClient } from "@zemio/db";
import { type DeepMockProxy, mockDeep } from "vitest-mock-extended";

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export function createMockDb(): MockPrismaClient {
	return mockDeep<PrismaClient>();
}

export type RawQueryCall = {
	/** The literal SQL fragments, joined with `?` where a value was interpolated. */
	sql: string;
	/** The interpolated values, in positional order. */
	values: unknown[];
};

/**
 * Reads back a tagged-template `$queryRaw` call. Prisma invokes the mock as
 * `(strings, ...values)`, so this splits it into the literal SQL (for asserting
 * on clauses that aren't parameterized, e.g. a status filter or a column name)
 * and the bind values in positional order (so swapped bindings are caught).
 */
export function readRawQueryCall(
	db: MockPrismaClient,
	callIndex = 0,
): RawQueryCall {
	const call = (db.$queryRaw as unknown as { mock: { calls: unknown[][] } }).mock
		.calls[callIndex];
	if (!call) {
		throw new Error(`no $queryRaw call recorded at index ${callIndex}`);
	}
	const [strings, ...values] = call as [readonly string[], ...unknown[]];
	return { sql: strings.join("?"), values };
}

import { TRPCError } from "@trpc/server";
import { expect } from "vitest";
import type { MockTRPCContext } from "./context";

/**
 * Casts a mock context to whatever context type `createCaller` expects.
 * Mock contexts deliberately don't satisfy the full better-auth `Session`
 * type — only the fields the procedure middleware chain actually reads off
 * it — so callers need an explicit escape hatch here rather than one
 * `biome-ignore`d cast per test file.
 */
export function asTRPCContext<TContext>(ctx: MockTRPCContext): TContext {
	// biome-ignore lint/suspicious/noExplicitAny: intentional escape hatch, see doc comment above
	return ctx as any as TContext;
}

/** Asserts that `promise` rejects with a `TRPCError` carrying the given code. */
export async function expectTRPCErrorCode(
	promise: Promise<unknown>,
	code: TRPCError["code"],
): Promise<void> {
	try {
		await promise;
		throw new Error("expected promise to reject with a TRPCError");
	} catch (error) {
		expect(error).toBeInstanceOf(TRPCError);
		expect((error as TRPCError).code).toBe(code);
	}
}

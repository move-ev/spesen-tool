import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbClient } from "./client";

declare global {
	var __zemio_db: unknown;
}

beforeEach(() => {
	global.__zemio_db = undefined;
});

describe("createDbClient", () => {
	it("creates the client on first call", () => {
		const client = {};
		const create = vi.fn(() => client as never);

		const result = createDbClient(create);

		expect(result).toBe(client);
		expect(create).toHaveBeenCalledTimes(1);
	});

	it("caches the client across repeated calls instead of recreating it", () => {
		const create = vi.fn(() => ({}) as never);

		const first = createDbClient(create);
		const second = createDbClient(create);

		expect(second).toBe(first);
		expect(create).toHaveBeenCalledTimes(1);
	});
});

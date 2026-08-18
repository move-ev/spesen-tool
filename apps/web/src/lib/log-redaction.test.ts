import { describe, expect, it } from "vitest";
import { REDACTED, toLogAttributes } from "./log-redaction";

describe("toLogAttributes", () => {
	it("redacts user identifiers at the top level", () => {
		expect(toLogAttributes({ userId: "user_1" })).toEqual({ userId: REDACTED });
	});

	it("matches identifier keys case-insensitively", () => {
		expect(toLogAttributes({ UserID: "user_1", Email: "a@b.c" })).toEqual({
			UserID: REDACTED,
			Email: REDACTED,
		});
	});

	it("keeps organizationId — it identifies a tenant, not a person", () => {
		expect(toLogAttributes({ organizationId: "org_1" })).toEqual({
			organizationId: "org_1",
		});
	});

	it("redacts identifiers nested inside objects", () => {
		const result = toLogAttributes({ ctx: { userId: "user_1", ok: true } });
		expect(result.ctx).toBe(JSON.stringify({ userId: REDACTED, ok: true }));
	});

	it("redacts identifiers nested inside arrays", () => {
		const result = toLogAttributes({ members: [{ userId: "user_1" }] });
		expect(result.members).toBe(JSON.stringify([{ userId: REDACTED }]));
	});

	it("drops absent values rather than emitting a redaction marker", () => {
		expect(toLogAttributes({ userId: undefined, ok: true })).toEqual({
			ok: true,
		});
	});

	it("preserves primitives unchanged", () => {
		expect(toLogAttributes({ path: "read", durationMs: 12, ok: false })).toEqual({
			path: "read",
			durationMs: 12,
			ok: false,
		});
	});

	it("reduces an Error to its message", () => {
		expect(toLogAttributes({ error: new Error("boom") })).toEqual({
			error: "boom",
		});
	});

	it("returns an empty object when there are no fields", () => {
		expect(toLogAttributes()).toEqual({});
	});
});

import { describe, expect, it, vi } from "vitest";
import type { SettingsItem, SettingsItemContext } from "./types";
import { resolveVisibleItems } from "./use-settings-group";

function entry(
	href: string,
	isVisible?: SettingsItem["isVisible"],
): SettingsItem {
	return {
		label: href,
		href,
		icon: (() => null) as unknown as SettingsItem["icon"],
		description: href,
		isVisible,
	};
}

/** Nothing here reads the context; the gates under test are the whole subject. */
const ctx = {
	authClient: {},
	billingEnabled: true,
} as unknown as SettingsItemContext;

describe("resolving which settings entries a caller sees", () => {
	it("keeps the entries that carry no gate, in the order given", async () => {
		const items = [entry("/a"), entry("/b"), entry("/c")];

		await expect(resolveVisibleItems(items, ctx)).resolves.toEqual(items);
	});

	it("drops a gated entry that says no and keeps the rest in place", async () => {
		const items = [entry("/a"), entry("/gated", async () => false), entry("/c")];

		const visible = await resolveVisibleItems(items, ctx);

		expect(visible.map((item) => item.href)).toEqual(["/a", "/c"]);
	});

	it("takes a gate that answers without waiting", async () => {
		const items = [entry("/a"), entry("/gated", () => true)];

		const visible = await resolveVisibleItems(items, ctx);

		expect(visible.map((item) => item.href)).toEqual(["/a", "/gated"]);
	});

	it("refuses to answer at all when one gate cannot", async () => {
		// A gate reaches the auth server, so a blip arrives as a rejection. It
		// must not pass for a `false` here and it must not pass for a `true`
		// either: the caller decides, and it falls back to the ungated entries.
		const items = [
			entry("/a"),
			entry("/gated", async () => {
				throw new Error("offline");
			}),
		];

		await expect(resolveVisibleItems(items, ctx)).rejects.toThrow("offline");
	});

	it("asks every gate exactly once", async () => {
		const gate = vi.fn().mockResolvedValue(true);
		const items = [entry("/a"), entry("/gated", gate)];

		await resolveVisibleItems(items, ctx);

		expect(gate).toHaveBeenCalledTimes(1);
		expect(gate).toHaveBeenCalledWith(ctx);
	});
});

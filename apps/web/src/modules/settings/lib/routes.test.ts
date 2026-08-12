import { describe, expect, it, vi } from "vitest";
import { settingsRoutes } from "./routes";
import type { SettingsItemContext } from "./types";

function billingItem() {
	const org = settingsRoutes.find((group) =>
		group.items.some((item) => item.href === "/settings/org/billing"),
	);
	const item = org?.items.find(
		(candidate) => candidate.href === "/settings/org/billing",
	);

	if (!item) throw new Error("No billing entry in the settings navigation.");
	return item;
}

/** An auth client that answers the owner check either way. */
function context(args: {
	isOwner?: boolean;
	billingEnabled?: boolean;
	error?: boolean;
}): SettingsItemContext & { hasPermission: ReturnType<typeof vi.fn> } {
	const hasPermission = vi.fn().mockResolvedValue({
		data: { success: args.isOwner ?? true },
		error: args.error ? new Error("offline") : null,
	});

	return {
		authClient: { organization: { hasPermission } },
		billingEnabled: args.billingEnabled ?? true,
		hasPermission,
	} as unknown as SettingsItemContext & {
		hasPermission: ReturnType<typeof vi.fn>;
	};
}

describe("the billing entry in the settings navigation", () => {
	it("sits with the other organization settings", () => {
		const group = settingsRoutes.find((candidate) =>
			candidate.items.some((item) => item.href === "/settings/org/billing"),
		);

		expect(group?.items.map((item) => item.href)).toContain(
			"/settings/org/general",
		);
	});

	it("is shown to an owner on a deployment that bills", async () => {
		const ctx = context({ isOwner: true, billingEnabled: true });

		await expect(billingItem().isVisible?.(ctx)).resolves.toBe(true);
	});

	it("is hidden from an administrator and an ordinary member", async () => {
		const ctx = context({ isOwner: false, billingEnabled: true });

		await expect(billingItem().isVisible?.(ctx)).resolves.toBe(false);
	});

	it("is absent when the deployment does not bill, whoever is asking", async () => {
		const ctx = context({ isOwner: true, billingEnabled: false });

		await expect(billingItem().isVisible?.(ctx)).resolves.toBe(false);
		// Nothing to ask about: there is no billing page behind it either way.
		expect(ctx.hasPermission).not.toHaveBeenCalled();
	});

	it("is hidden rather than shown when the permission check fails", async () => {
		const ctx = context({ isOwner: true, error: true });

		await expect(billingItem().isVisible?.(ctx)).resolves.toBe(false);
	});

	it("leaves the other organization entries ungated", () => {
		const group = settingsRoutes.find((candidate) =>
			candidate.items.some((item) => item.href === "/settings/org/billing"),
		);
		const others = group?.items.filter(
			(item) => item.href !== "/settings/org/billing",
		);

		expect(others?.every((item) => item.isVisible === undefined)).toBe(true);
	});
});

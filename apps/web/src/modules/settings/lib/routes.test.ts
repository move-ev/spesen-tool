import { describe, expect, it, vi } from "vitest";
import { settingsRoutes } from "./routes";
import type { SettingsGroup, SettingsItemContext } from "./types";

/** The group the billing entry sits in, as any surface reads it. */
function organizationGroup(): SettingsGroup {
	const group = settingsRoutes.find((candidate) =>
		candidate.items.some((item) => item.href === "/settings/org/billing"),
	);

	if (!group) throw new Error("No billing entry in the settings navigation.");
	return group;
}

/** What a surface listing a group ends up showing, its item gates resolved. */
async function visibleHrefs(group: SettingsGroup, ctx: SettingsItemContext) {
	const decisions = await Promise.all(
		group.items.map(async (item) =>
			item.isVisible ? await item.isVisible(ctx) : true,
		),
	);

	return group.items
		.filter((_, index) => decisions[index])
		.map((item) => item.href);
}

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

	it("answers the same for every surface that asks about the same caller", async () => {
		// The sidebar and the overview page both list these groups. The first
		// item-level gate reached one and not the other, so an administrator saw
		// a billing entry on the overview that the sidebar had already hidden.
		// The gates therefore have to answer from their context alone: one that
		// remembered its first answer, or that read anything the two surfaces
		// hold separately, would divide them again even while they share the
		// decision. Asking as an administrator, then as an owner, then as an
		// administrator once more is what a second surface mounting after the
		// first looks like.
		const group = organizationGroup();

		const firstSurface = await visibleHrefs(group, context({ isOwner: false }));
		const asOwner = await visibleHrefs(group, context({ isOwner: true }));
		const secondSurface = await visibleHrefs(group, context({ isOwner: false }));

		expect(secondSurface).toEqual(firstSurface);
		expect(firstSurface).not.toContain("/settings/org/billing");
		expect(asOwner).toContain("/settings/org/billing");
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

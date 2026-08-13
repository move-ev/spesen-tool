"use client";

import { useQuery } from "@tanstack/react-query";
import React from "react";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";
import type { SettingsGroup, SettingsItem, SettingsItemContext } from "./types";

/** Items that carry no gate of their own, which is all of them but one. */
function ungatedItems(group: SettingsGroup): SettingsItem[] {
	return group.items.filter((item) => !item.isVisible);
}

/**
 * The items whose gates say yes, in the order they were given.
 *
 * Refuses rather than answering on behalf of a gate that could not: a gate
 * reaches the auth server, so a lost connection arrives as a rejection and not
 * as a `false`, and only the caller knows what to fall back to. Exported so
 * that contract can be tested without rendering anything.
 */
async function resolveVisibleItems(
	items: SettingsItem[],
	ctx: SettingsItemContext,
): Promise<SettingsItem[]> {
	const answers = await Promise.all(
		items.map(async (item) =>
			item.isVisible ? await item.isVisible(ctx) : true,
		),
	);

	return items.filter((_, index) => answers[index]);
}

/**
 * Resolves what a caller may see of one settings group.
 *
 * Shared by the sidebar and the settings overview, which both list the same
 * groups. They each used to resolve the group's own permission themselves,
 * which is how the first item-level gate reached one surface and not the
 * other — an administrator saw a billing entry on the overview page that the
 * sidebar had already hidden.
 *
 * Hiding is presentation throughout. The page behind an entry does its own
 * check, and is the only thing that actually refuses anyone.
 *
 * Every gate is answered through a query rather than an effect. A gate is a
 * network call and so can fail, and an effect has nowhere to put a failure:
 * the rejection went unhandled and the group kept whatever it was showing for
 * as long as it stayed mounted, which for the sidebar is the whole session. A
 * query holds the failure, retries a blip on its own, and asks again when the
 * tab is focused or the connection returns.
 */
function useSettingsGroup(group: SettingsGroup): {
	visible: boolean;
	items: SettingsItem[];
} {
	const permission = useQuery({
		queryKey: ["settings-group", group.label, "permission"],
		queryFn: () => group.hasPermission(authClient),
	});
	// Hidden is where an unanswered gate leaves things, here and below. Of the
	// two ways to be wrong, showing an entry to someone the check would have
	// refused is the one that leaks; the other costs a link that the retry puts
	// back.
	const hasPerm = permission.data ?? false;

	// What the item gates say with billing assumed on, which is the half of them
	// the auth server answers. Never shown as it stands — only used to decide
	// whether this caller has any reason to ask whether the deployment bills.
	// The billing entry is the owner's alone, so every administrator was
	// fetching a status only to discard it, on deployments that do not bill as
	// much as on those that do.
	const couldSee = useQuery({
		queryKey: ["settings-group", group.label, "items", true],
		queryFn: () =>
			resolveVisibleItems(group.items, { authClient, billingEnabled: true }),
		enabled: hasPerm && group.items.some((item) => item.isVisible),
	});

	// Sound because billing can only ever add an entry: a gate that says no
	// while it is assumed on says no when it is off. Until the probe answers
	// this is false, which delays the status by one round trip rather than
	// withholding it — an owner's entry still arrives.
	const needsBillingState =
		couldSee.data?.some((item) => item.isVisible) ?? false;

	const billing = api.billing.status.useQuery(undefined, {
		enabled: needsBillingState,
	});
	const billingEnabled = billing.data?.enabled ?? false;

	// The key the probe already used, wherever the deployment does bill, so the
	// gates are answered once and not twice. A deployment that turns out not to
	// bill is a different question and gets asked as one.
	const resolved = useQuery({
		queryKey: ["settings-group", group.label, "items", billingEnabled],
		queryFn: () =>
			resolveVisibleItems(group.items, { authClient, billingEnabled }),
		enabled: needsBillingState && !billing.isPending,
	});

	const ungated = React.useMemo(() => ungatedItems(group), [group]);

	return {
		visible: hasPerm,
		// The probe's answer would serve, but it rests on an assumption, and an
		// owner of an instance that does not bill would watch a billing entry
		// appear and then go. So: the entries that need no gate, until the gates
		// have been answered for the deployment this actually is.
		items: resolved.data ?? ungated,
	};
}

export { resolveVisibleItems, useSettingsGroup };

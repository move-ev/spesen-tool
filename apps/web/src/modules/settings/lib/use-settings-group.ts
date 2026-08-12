"use client";

import React from "react";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";
import type { SettingsGroup, SettingsItem } from "./types";

/** Items that carry no gate of their own, which is all of them but one. */
function ungatedItems(group: SettingsGroup): SettingsItem[] {
	return group.items.filter((item) => !item.isVisible);
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
 */
function useSettingsGroup(group: SettingsGroup): {
	visible: boolean;
	items: SettingsItem[];
} {
	const [hasPerm, setHasPerm] = React.useState(false);
	// Starts at the items that need nothing resolved, so a group renders its
	// ordinary entries immediately rather than blinking in once an effect has
	// run. A gated item joins them when its answer arrives.
	const [items, setItems] = React.useState<SettingsItem[]>(() =>
		ungatedItems(group),
	);

	React.useEffect(() => {
		let cancelled = false;

		Promise.resolve(group.hasPermission(authClient)).then((result) => {
			if (!cancelled) {
				setHasPerm(result);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [group]);

	// Only a group the caller can see, and which actually holds a gated item,
	// needs to know whether this deployment bills. That keeps the query off the
	// user and platform settings, where there may be no active organization for
	// it to answer about.
	const needsBillingState =
		hasPerm && group.items.some((item) => item.isVisible);
	const billing = api.billing.status.useQuery(undefined, {
		enabled: needsBillingState,
	});
	const billingEnabled = billing.data?.enabled ?? false;

	React.useEffect(() => {
		if (!needsBillingState || billing.isPending) {
			return;
		}

		let cancelled = false;

		Promise.all(
			group.items.map(async (item) =>
				item.isVisible
					? await item.isVisible({ authClient, billingEnabled })
					: true,
			),
		).then((results) => {
			if (!cancelled) {
				setItems(group.items.filter((_, index) => results[index]));
			}
		});

		return () => {
			cancelled = true;
		};
	}, [group, billingEnabled, needsBillingState, billing.isPending]);

	return { visible: hasPerm, items };
}

export { useSettingsGroup };

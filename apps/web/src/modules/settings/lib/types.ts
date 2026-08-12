import type { LucideIcon } from "lucide-react";
import type { authClient } from "@/server/better-auth/client";

/**
 * What an item-level gate gets to decide on.
 *
 * Richer than the group's, which only ever asks the auth client: an item can
 * also be absent because the deployment does not have the feature at all,
 * which no permission can express. Whether this deployment bills is a
 * server-side fact, read through `billing.status` rather than from
 * configuration — none of which reaches the browser.
 */
type SettingsItemContext = {
	authClient: typeof authClient;
	billingEnabled: boolean;
};

type SettingsItem = {
	label: string;
	href: string;
	icon: LucideIcon;
	description: string;
	/**
	 * Optional gate for one item, on top of its group's. An item without one is
	 * shown to anyone who can see the group. Hiding is presentation only — the
	 * page behind it does its own check.
	 */
	isVisible?: (ctx: SettingsItemContext) => boolean | Promise<boolean>;
};

type SettingsGroup = {
	label: string;
	hasPermission: (client: typeof authClient) => boolean | Promise<boolean>;
	items: SettingsItem[];
};

export type { SettingsGroup, SettingsItem, SettingsItemContext };

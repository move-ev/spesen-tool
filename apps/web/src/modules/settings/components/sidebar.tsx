"use client";

import { ChevronLeftIcon, GridIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";
import { settingsRoutes } from "../lib/routes";
import type {
	SettingsGroup as SettingsGroupType,
	SettingsItem as SettingsItemType,
} from "../lib/types";

function SettingsSidebar({
	className,
	...props
}: React.ComponentProps<"aside">) {
	const t = useTranslations("modules.settings");

	return (
		<aside
			className={cn("h-svh w-64 border-base-200 border-r bg-base-50", className)}
			{...props}
		>
			<div className="px-4 pt-6 pb-2">
				<Link
					className="group/link flex w-fit items-center justify-center gap-1.5 font-semibold text-base-500 text-sm transition-colors hover:text-accent-600"
					href={ROUTES.USER_DASHBOARD()}
				>
					<ChevronLeftIcon className="size-3.5 shrink-0 text-base-500 transition-colors group-hover/link:text-accent-400" />
					{t("actions.back")}
				</Link>
			</div>
			<div className="mt-4 space-y-6 px-2">
				<div>
					<li className="group/item relative flex items-center justify-start gap-2 rounded-sm px-2 py-2 font-medium text-base-700 text-sm leading-none transition-colors hover:bg-base-100">
						<GridIcon className="size-3.5 shrink-0 text-base-500" />
						<Link href={ROUTES.SETTINGS()}>
							Overview
							<span className="absolute inset-0 h-full w-full" />
						</Link>
					</li>
				</div>
				{settingsRoutes.map((group) => (
					<SettingsGroup group={group} key={group.label} />
				))}
			</div>
		</aside>
	);
}

/** Items that carry no gate of their own, which is all of them but one. */
function ungatedItems(group: SettingsGroupType): SettingsItemType[] {
	return group.items.filter((item) => !item.isVisible);
}

function SettingsGroup({
	className,
	group,
	...props
}: React.ComponentProps<"div"> & {
	group: SettingsGroupType;
}) {
	const [hasPerm, setHasPerm] = React.useState(false);
	// Starts at the items that need nothing resolved, so a group renders its
	// ordinary entries immediately rather than blinking in once an effect has
	// run. A gated item joins them when its answer arrives.
	const [visibleItems, setVisibleItems] = React.useState<SettingsItemType[]>(
		() => ungatedItems(group),
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
	// user and platform settings pages, where there may be no active
	// organization for it to answer about.
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
				setVisibleItems(group.items.filter((_, index) => results[index]));
			}
		});

		return () => {
			cancelled = true;
		};
	}, [group, billingEnabled, needsBillingState, billing.isPending]);

	if (!hasPerm) {
		return null;
	}

	return (
		<div className={cn("", className)} data-slot="settings-group" {...props}>
			<span className="block px-2 font-semibold text-base-500 text-xs">
				{group.label}
			</span>
			<ul className="mt-2 space-y-0.5">
				{visibleItems.map(({ icon: Icon, ...item }) => (
					<li
						className="group/item relative flex items-center justify-start gap-2 rounded-sm px-2 py-2 font-medium text-base-700 text-sm leading-none transition-colors hover:bg-base-100"
						key={item.href}
					>
						<Icon className="size-3.5 shrink-0 text-base-500" />
						<Link href={item.href}>
							{item.label}
							<span className="absolute inset-0 h-full w-full" />
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

export { SettingsSidebar };

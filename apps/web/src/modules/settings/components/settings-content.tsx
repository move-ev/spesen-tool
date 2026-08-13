"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type React from "react";
import { cn } from "@/lib/utils";
import { settingsRoutes } from "../lib/routes";
import type { SettingsGroup as SettingsGroupType } from "../lib/types";
import { useSettingsGroup } from "../lib/use-settings-group";
import { SettingsTitle } from "./settings-typography";

function SettingsContent({
	className,
	...props
}: React.ComponentProps<"main">) {
	const t = useTranslations("modules.settings.overview");

	return (
		<main
			className={cn("py-16", className)}
			data-slot="settings-content"
			{...props}
		>
			<div className="space-y-16">
				{settingsRoutes.map((group) => (
					<SettingsGroup group={group} key={group.label} />
				))}
			</div>
			<section className="container mt-12 max-w-4xl">
				<p className="text-base-500 text-xs">
					{t.rich("contactText", {
						link: (chunks) => (
							<Link
								className="font-medium text-accent-600 transition-colors hover:text-accent-500"
								href={"#"}
							>
								{chunks}
							</Link>
						),
					})}
				</p>
			</section>
		</main>
	);
}

function SettingsGroup({
	className,
	group,
	...props
}: React.ComponentProps<"div"> & {
	group: SettingsGroupType;
}) {
	const { visible, items } = useSettingsGroup(group);

	if (!visible) {
		return null;
	}

	return (
		<div
			className={cn("container max-w-4xl", className)}
			data-slot="settings-group"
			{...props}
		>
			<SettingsTitle>{group.label}</SettingsTitle>

			<div className="mt-6 grid gap-12 sm:grid-cols-2 xl:grid-cols-3">
				{items.map(({ icon: Icon, ...item }) => (
					<div
						className={cn(
							"group/item relative isolate flex items-start justify-start gap-6",
							// "after:absolute after:inset-0 after:top-1/2 after:left-1/2 after:z-[-1] after:h-[calc(100%+1.5rem)] after:w-[calc(100%+1.5rem)] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-md after:bg-slate-100 after:opacity-0 after:transition-opacity after:content-[''] hover:after:opacity-100",
						)}
						key={item.label}
					>
						<div className="relative mt-1 flex size-7 shrink-0 items-center justify-center rounded-md bg-background text-base-600 shadow-sm ring-1 ring-base-700/10">
							<div className="absolute top-1/2 left-0 -z-10 size-7 -translate-x-2 -translate-y-1/2 -rotate-2 scale-90 rounded-md border border-base-200 transition-transform group-hover/item:-translate-x-2.5 group-hover/item:-rotate-6" />
							<div className="absolute top-1/2 right-0 -z-10 size-7 translate-x-2 -translate-y-1/2 rotate-2 scale-90 rounded-md border border-base-200 transition-transform group-hover/item:translate-x-2.5 group-hover/item:rotate-6" />
							<Icon className="size-4 transition-colors group-hover/item:text-accent-600" />
						</div>
						<div>
							<Link
								className="font-semibold text-base-800 text-sm transition-colors group-hover/item:text-accent-600"
								href={item.href}
							>
								{item.label}
								<span className="absolute inset-0 h-full w-full" />
							</Link>
							<p className="mt-0.5 text-base-500 text-xs">{item.description}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export { SettingsContent };

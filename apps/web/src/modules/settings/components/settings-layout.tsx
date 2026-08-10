"use client";

import { SaveBar } from "@/components/save-bar";
import { cn } from "@/lib/utils";
import { SettingsSidebar } from "./sidebar";

function SettingsLayout({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("flex", className)} data-slot="settings-layout" {...props}>
			<SettingsSidebar />
			<div className="h-svh min-w-0 flex-1 overflow-y-auto">{children}</div>
			<SaveBar />
		</div>
	);
}

export { SettingsLayout };

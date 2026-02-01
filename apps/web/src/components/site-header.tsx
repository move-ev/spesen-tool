"use client";

import { Button } from "@zemio/ui/components/button";
import { SidebarTrigger } from "@zemio/ui/components/sidebar";
import { SettingsIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

export function SiteHeader({
	className,
	...props
}: React.ComponentProps<"header">) {
	return (
		<header
			className={cn("bg-background", className)}
			data-slot="site-header"
			{...props}
		>
			<div className="container py-2">
				<div className="flex items-center justify-start gap-4">
					<SidebarTrigger />
					<Button
						className={"ml-auto"}
						render={
							<Link href={"#"}>
								<SettingsIcon />
							</Link>
						}
						size={"icon-sm"}
						variant={"ghost"}
					/>
					<UserMenu variant={"small"} />
				</div>
			</div>
		</header>
	);
}

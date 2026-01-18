"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROUTES } from "@/lib/consts";
import { cn } from "@/lib/utils";
import { AppLogo } from "./app-logo";
import { SignOut } from "./sign-out";

export function SiteHeader({
	className,
	...props
}: React.ComponentProps<"header">) {
	return (
		<header
			className={cn(
				"sticky top-0 z-50 border-b bg-background/95 backdrop-blur",
				className,
			)}
			data-slot="site-header"
			{...props}
		>
			<div className="container py-4">
				<div className="flex items-center justify-start gap-4">
					<Link
						aria-label="Zur Startseite"
						className="me-auto fill-[#0B263F] dark:fill-white"
						href={ROUTES.USER_DASHBOARD}
					>
						<AppLogo className="h-6 w-fit" />
					</Link>
					<ThemeToggle variant={"outline"} />
					<SignOut />
				</div>
			</div>
		</header>
	);
}

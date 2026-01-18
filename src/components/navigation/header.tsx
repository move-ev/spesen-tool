"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/consts";
import { authClient } from "@/server/better-auth/client";
import { SignOut } from "../sign-out";

export function Header() {
	const { theme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isDark = theme === "dark";

	return (
		<header className="sticky top-5 z-50 mt-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<a
							aria-label="Zur Startseite"
							className="flex items-center transition-opacity hover:opacity-80"
							href={ROUTES.USER_DASHBOARD}
						>
							{mounted && (
								<>
									{!isDark && (
										<Image
											alt="move e.V."
											className="h-8 w-auto"
											height={32}
											src="/assets/logo-default@128x351.svg"
											width={128}
										/>
									)}
									{isDark && (
										<Image
											alt="move e.V."
											className="h-8 w-auto"
											height={32}
											src="/assets/woodmark-light@128x750.svg"
											width={128}
										/>
									)}
								</>
							)}
						</a>
					</div>
					<div className="flex items-center gap-4">
						<ThemeToggle variant={"outline"} />
						<SignOut />
					</div>
				</div>
			</div>
		</header>
	);
}

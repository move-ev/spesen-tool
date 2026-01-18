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

export function Header() {
	const { theme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isDark = theme === "dark";

	const handleLogout = async () => {
		try {
			// Sign out from Better-Auth
			await authClient.signOut();

			// Clear all cookies
			document.cookie.split(";").forEach((c) => {
				const eqPos = c.indexOf("=");
				const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
				// biome-ignore lint/suspicious/noDocumentCookie: We need to clear all cookies to avoid reusing the first account
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
				// biome-ignore lint/suspicious/noDocumentCookie: We need to clear all cookies to avoid reusing the first account
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
			});

			toast.success("Erfolgreich abgemeldet");

			// Redirect to Microsoft logout to clear their SSO session, then back to our login
			const postLogoutRedirectUri = encodeURIComponent(
				`${window.location.origin}${ROUTES.AUTH}`,
			);
			window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${postLogoutRedirectUri}`;
		} catch (error) {
			console.error("Logout error:", error);
			toast.error("Fehler beim Abmelden");
		}
	};

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
						<ThemeToggle />
						<Button
							className="gap-4"
							onClick={handleLogout}
							size="sm"
							variant="outline"
						>
							<LogOut className="h-4 w-4" />
							<span className="hidden sm:inline">Abmelden</span>
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}

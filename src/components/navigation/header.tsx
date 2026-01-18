"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/server/better-auth/client";
import { ROUTES } from "@/lib/consts";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
	const router = useRouter();
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
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
			});
			
			toast.success("Erfolgreich abgemeldet");
			
			// Redirect to Microsoft logout to clear their SSO session, then back to our login
			const postLogoutRedirectUri = encodeURIComponent(`${window.location.origin}${ROUTES.AUTH}`);
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
							href={ROUTES.USER_DASHBOARD}
							className="flex items-center transition-opacity hover:opacity-80"
							aria-label="Zur Startseite"
						>
							{mounted && (
								<>
									{!isDark && (
										<img
											src="/assets/logo-default@128x351.svg"
											alt="move e.V."
											className="h-8 w-auto"
										/>
									)}
									{isDark && (
										<img
											src="/assets/woodmark-light@128x750.svg"
											alt="move e.V."
											className="h-8 w-auto"
										/>
									)}
								</>
							)}
						</a>
					</div>
					<div className="flex items-center gap-4">
						<ThemeToggle />
						<Button
							variant="outline"
							size="sm"
							onClick={handleLogout}
							className="gap-4"
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

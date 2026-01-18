"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/lib/consts";
import { authClient } from "@/server/better-auth/client";
import { Button } from "../ui/button";

export function LoginForm({ ...props }: React.ComponentProps<"form">) {
	const [isLoading, setIsLoading] = useState(false);

	const signInWithMicrosoft = async () => {
		try {
			setIsLoading(true);
			// Clear any existing session and ALL cookies to avoid reusing the first account
			try {
				await authClient.signOut();
				// Clear ALL cookies (not just auth-related ones)
				document.cookie.split(";").forEach((c) => {
					const eqPos = c.indexOf("=");
					const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
					// biome-ignore lint/suspicious/noDocumentCookie: We need to clear all cookies to avoid reusing the first account
					document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
					// biome-ignore lint/suspicious/noDocumentCookie: We need to clear all cookies to avoid reusing the first account
					document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
				});
			} catch (error) {
				// Ignore sign-out errors (e.g. no active session)
				console.warn("Sign-out before login failed:", error);
			}

			const res = await authClient.signIn.social({
				provider: "microsoft",
				callbackURL: ROUTES.USER_DASHBOARD,
			});

			if (res.error) {
				// Check if it's a domain restriction error
				if (
					res.error.message?.includes("move-ev.de") ||
					res.error.message?.includes("E-Mail-Adresse")
				) {
					toast.error(
						"Nur Benutzer mit einer @move-ev.de E-Mail-Adresse können sich anmelden.",
					);
				} else {
					toast.error(res.error.message ?? "Ein Fehler ist aufgetreten");
				}
				setIsLoading(false);
				return;
			}

			// If we get a URL, redirect to it
			const redirectUrl = res.data?.url;
			if (redirectUrl) {
				window.location.href = redirectUrl;
			}
		} catch (error) {
			console.error("Login error:", error);
			toast.error("Ein Fehler ist beim Anmelden aufgetreten");
			setIsLoading(false);
		}
	};

	return (
		<form
			id="login-form"
			onSubmit={(e) => {
				e.preventDefault();
				signInWithMicrosoft();
			}}
			{...props}
		>
			<Button
				className={"w-full"}
				disabled={isLoading}
				type="submit"
				variant={"outline"}
			>
				{isLoading ? "Leite weiter..." : "Login mit Microsoft"}
			</Button>
			<p className="mt-2 text-center text-muted-foreground text-sm">
				Nur für @move-ev.de E-Mail-Adressen
			</p>
		</form>
	);
}

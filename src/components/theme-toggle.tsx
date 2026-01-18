"use client";

import { Moon, MoonIcon, Sun, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Kbd, KbdGroup } from "./ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function ThemeToggle({ ...props }: React.ComponentProps<typeof Button>) {
	const { theme, setTheme } = useTheme();

	const handleThemeToggle = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// On Mac: event.metaKey (⌘), on Windows: event.ctrlKey, but spec says meta for ⌘
			if (event.metaKey && (event.key === "d" || event.key === "D")) {
				event.preventDefault();
				setTheme(theme === "dark" ? "light" : "dark");
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [theme, setTheme]);

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button onClick={handleThemeToggle} size="icon" variant="ghost" {...props}>
						{theme === "dark" ? <SunIcon /> : <MoonIcon />}
					</Button>
				}
			/>
			<TooltipContent sideOffset={8}>
				<span className="me-2">Toggle theme</span>
				<KbdGroup>
					<Kbd>⌘</Kbd> + <Kbd>D</Kbd>
				</KbdGroup>
			</TooltipContent>
		</Tooltip>
	);
}

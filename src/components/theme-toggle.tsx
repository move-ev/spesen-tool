"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const isDark = theme === "dark";

	return (
		<div
			className={cn(
				"inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-xs",
				"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
				"transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
			)}
		>
			<button
				aria-label="Hellmodus aktivieren"
				className={`flex items-center justify-center p-1 transition-opacity ${
					!isDark ? "opacity-100" : "opacity-40 hover:opacity-60"
				}`}
				onClick={() => setTheme("light")}
				type="button"
			>
				<Sun className="h-4 w-4" />
			</button>
			<button
				aria-label="Dunkelmodus aktivieren"
				className={`flex items-center justify-center p-1 transition-opacity ${
					isDark ? "opacity-100" : "opacity-40 hover:opacity-60"
				}`}
				onClick={() => setTheme("dark")}
				type="button"
			>
				<Moon className="h-4 w-4" />
			</button>
		</div>
	);
}

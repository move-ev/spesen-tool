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
				"inline-flex items-center justify-center h-8 rounded-md px-3 text-xs gap-2",
				"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
				"transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
			)}
		>
			<button
				type="button"
				onClick={() => setTheme("light")}
				className={`flex items-center justify-center transition-opacity p-1 ${
					!isDark
						? "opacity-100"
						: "opacity-40 hover:opacity-60"
				}`}
				aria-label="Hellmodus aktivieren"
			>
				<Sun className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => setTheme("dark")}
				className={`flex items-center justify-center transition-opacity p-1 ${
					isDark
						? "opacity-100"
						: "opacity-40 hover:opacity-60"
				}`}
				aria-label="Dunkelmodus aktivieren"
			>
				<Moon className="h-4 w-4" />
			</button>
		</div>
	);
}

import { Badge } from "@zemio/ui/components/badge";
import { Skeleton } from "@zemio/ui/components/skeleton";
import { ArrowRightIcon } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface StatusCardProps extends React.ComponentProps<"div"> {
	/**
	 * The value to display in the card.
	 *
	 * Accepts undefined to show a loading state.
	 */
	value: number | undefined;

	/**
	 * Whether the card is in a loading state.
	 *
	 * If true, the value will be undefined.
	 */
	loading?: boolean;

	/**
	 * Discription of the displayed data.
	 */
	description: string;

	/**
	 * The change in the value.
	 *
	 * Accepts undefined to show a loading state.
	 */
	change: number | undefined;

	/**
	 * Whether the downword trends are to be interpreted as positive.
	 */
	inversedPositive?: boolean;

	/**
	 * Whether to format the value as currency (EUR).
	 */
	formatAsCurrency?: boolean;
}

export function StatusCard({
	className,
	value,
	loading,
	description,
	change,
	inversedPositive,
	formatAsCurrency,
	...props
}: StatusCardProps) {
	const formattedValue = useMemo(() => {
		if (value === undefined) return undefined;
		if (formatAsCurrency) {
			return new Intl.NumberFormat("de-DE", {
				style: "currency",
				currency: "EUR",
			}).format(value);
		}
		return value.toLocaleString("de-DE");
	}, [value, formatAsCurrency]);

	const { color, direction } = useMemo((): {
		color: "red" | "green" | "neutral";
		direction: "up" | "down" | "forward";
	} => {
		if (!change || change === 0) {
			return {
				direction: "forward",
				color: "neutral",
			};
		}

		if (change >= 999) {
			return {
				direction: "forward",
				color: "neutral",
			};
		}

		if (change > 0) {
			return {
				direction: "up",
				color: inversedPositive ? "red" : "green",
			};
		}

		return {
			direction: "down",
			color: inversedPositive ? "green" : "red",
		};
	}, [change, inversedPositive]);

	return (
		<div
			className={cn(
				"data-group/status-card space-y-2 rounded-lg border bg-background p-4 shadow-xs",
				className,
			)}
			data-slot="status-card"
			{...props}
		>
			<div>
				{loading ? (
					<Skeleton aria-label="Lädt..." className="h-8 w-full max-w-32" />
				) : (
					<p aria-live="polite" className="font-semibold text-2xl">
						{formattedValue}
					</p>
				)}
			</div>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="block whitespace-nowrap text-muted-foreground text-sm">
					{description}
				</span>
				{loading || !change ? (
					<Skeleton className="h-4 w-16" />
				) : (
					<Badge className={cn("rounded-md")} variant={"outline"}>
						<ArrowRightIcon
							className={cn(
								"transform text-muted-foreground will-change-transform",
								direction === "up" && "-rotate-45",
								direction === "down" && "rotate-45",
								color === "red" && "text-red-500",
								color === "green" && "text-green-500",
							)}
						/>
						{formatChange(change)}
					</Badge>
				)}
			</div>
		</div>
	);
}

function formatChange(change: number) {
	// Handle special case for "new data" (previous was 0)
	if (change >= 999) {
		return "Neu";
	}

	const pct = Math.abs(change * 100);

	// Format based on magnitude
	if (pct >= 100) {
		return `${change > 0 ? "+" : "-"}${pct.toFixed(0)}%`;
	}
	if (pct >= 10) {
		return `${change > 0 ? "+" : "-"}${pct.toFixed(0)}%`;
	}
	return `${change > 0 ? "+" : "-"}${pct.toFixed(1)}%`;
}

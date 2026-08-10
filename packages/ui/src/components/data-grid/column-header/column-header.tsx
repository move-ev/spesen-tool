import type { Column } from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	ArrowUp,
	ChevronsUpDown,
	EyeOff,
	type LucideIcon,
	PinOffIcon,
} from "lucide-react";
import { cn } from "../../../lib/cn";
import { Button } from "../../button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../dropdown-menu";

interface DataGridColumnHeaderProps<TData, TValue>
	extends React.ComponentProps<"div"> {
	column: Column<TData, TValue>;
	title: string;
	icon?: LucideIcon;
}

export function DataGridColumnHeader<TData, TValue>({
	column,
	title,
	icon: Icon,
	className,
}: DataGridColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>;
	}

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							className="h-fit w-full rounded-none px-(--grid-cell-px) py-(--grid-cell-py) font-normal text-base-500 data-[state=open]:bg-accent"
							disableAnimation
							size="sm"
							variant="ghost"
						>
							{Icon && <Icon className="size-3.5 shrink-0 text-base-400" />}
							<span className="mr-auto">{title}</span>
							{column.getIsSorted() === "desc" ? (
								<ArrowDown />
							) : column.getIsSorted() === "asc" ? (
								<ArrowUp />
							) : (
								<ChevronsUpDown />
							)}
						</Button>
					}
				/>
				<DropdownMenuContent align="end" className={"min-w-fit"}>
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
							<ArrowUp />
							Sort ascending
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
							<ArrowDown />
							Sort descending
						</DropdownMenuItem>
						{column.getIsSorted() && (
							<DropdownMenuItem onClick={() => column.clearSorting()}>
								<ChevronsUpDown />
								Clear sort
							</DropdownMenuItem>
						)}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={() => column.pin("left")}>
							<ArrowLeftToLineIcon />
							Pin Left
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => column.pin("right")}>
							<ArrowRightToLineIcon />
							Pin Right
						</DropdownMenuItem>
						{column.getIsPinned() && (
							<DropdownMenuItem onClick={() => column.pin(false)}>
								<PinOffIcon />
								Unpin
							</DropdownMenuItem>
						)}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
							<EyeOff />
							Hide Column
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

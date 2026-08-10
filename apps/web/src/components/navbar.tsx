import { cn } from "@/lib/utils";

function Navbar({
	className,
	children,
	...props
}: React.ComponentProps<"nav">) {
	return (
		<nav
			className={cn("h-11 border-base-200 border-b", className)}
			data-slot="navbar"
			{...props}
		>
			<div
				className="flex h-full w-full items-center justify-start px-8"
				data-container
			>
				{children}
			</div>
		</nav>
	);
}

export { Navbar };

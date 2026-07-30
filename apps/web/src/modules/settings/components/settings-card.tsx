import { cn } from "@/lib/utils";

function SettingsCard({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("rounded-lg bg-base-100 p-0.75", className)}
			data-slot="settings-card"
			{...props}
		/>
	);
}

function SettingsCardLabel({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			className={cn(
				"block px-4 pt-1.25 pb-2 font-semibold text-base-600 text-xs leading-none",
				className,
			)}
			data-slot="settings-card-label"
			{...props}
		/>
	);
}

function SettingsCardContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"rounded-[calc(var(--radius-lg)-2px)] bg-white shadow-md ring-1 ring-base-700/10",
				"**:data-[slot=field]:grid **:data-[slot=field]:gap-8 **:data-[slot=field]:px-4 **:data-[slot=field]:py-6 **:data-[slot=field]:md:grid-cols-2",
				className,
			)}
			data-slot="settings-card-content"
			{...props}
		/>
	);
}

export { SettingsCard, SettingsCardContent, SettingsCardLabel };

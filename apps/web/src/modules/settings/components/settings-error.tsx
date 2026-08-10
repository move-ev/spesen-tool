import { SearchAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function SettingsError({
	className,
	message,
	description,
	...props
}: React.ComponentProps<"div"> & {
	message: string;
	description: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border border-base-200 border-dashed bg-base-50 p-8",
				className,
			)}
			data-slot="settings-error"
			{...props}
		>
			<SearchAlertIcon className="size-5 text-base-500" />
			<p className="mt-6 max-w-lg text-center font-medium text-base-800 text-sm">
				{message}
			</p>
			<p className="mt-1 max-w-lg text-center text-base-500 text-xs">
				{description}
			</p>
		</div>
	);
}

export { SettingsError };

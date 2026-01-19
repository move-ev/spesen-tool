"use client";

import {
	CheckIcon,
	PencilIcon,
	RefreshCcw,
	RefreshCcwIcon,
	SearchIcon,
	XIcon,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Report } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export function ReportAdministration({
	report,
	...props
}: React.ComponentProps<typeof Button> & { report: Report }) {
	const utils = api.useUtils();
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// On Mac: event.metaKey (⌘), on Windows: event.ctrlKey, but spec says meta for ⌘
			if (event.metaKey && (event.key === "b" || event.key === "B")) {
				event.preventDefault();
				setOpen(true);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const updateStatus = api.report.updateStatus.useMutation({
		onMutate: () => {
			toast.info("Status wird aktualisiert...");
		},
		onSuccess: () => {
			toast.success("Status aktualisiert", {
				description: "Antragsteller wurde per E-Mail informiert",
			});
			utils.report.getById.invalidate({ id: report.id });
		},
		onError: ({ message }) => {
			toast.error("Fehler beim Aktualisieren des Reports", {
				description: message ?? "Ein unerwarteter Fehler ist aufgetreten",
			});
		},
	});

	return (
		<DropdownMenu onOpenChange={setOpen} open={open}>
			<DropdownMenuTrigger render={<Button {...props} />} />
			<DropdownMenuContent
				align="end"
				className={cn("w-full min-w-(--anchor-width) max-w-72")}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel>Status ändern</DropdownMenuLabel>
					<DropdownMenuItem
						disabled={report.status === "ACCEPTED"}
						onClick={() =>
							updateStatus.mutate({ id: report.id, status: "ACCEPTED", notify: true })
						}
					>
						<CheckIcon /> Akzeptieren
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={report.status === "REJECTED"}
						onClick={() =>
							updateStatus.mutate({ id: report.id, status: "REJECTED", notify: true })
						}
						variant="destructive"
					>
						<XIcon /> Ablehnen
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={report.status === "NEEDS_REVISION"}
						onClick={() =>
							updateStatus.mutate({
								id: report.id,
								status: "NEEDS_REVISION",
								notify: true,
							})
						}
					>
						<RefreshCcwIcon /> Benötigt Überarbeitung
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={report.status === "PENDING_APPROVAL"}
						onClick={() =>
							updateStatus.mutate({
								id: report.id,
								status: "PENDING_APPROVAL",
								notify: true,
							})
						}
					>
						<SearchIcon /> In Bearbeitung
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

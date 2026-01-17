import type React from "react";
import { CreateReportForm } from "./forms/create-report-form";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";

export function CreateReport({
	...props
}: React.ComponentProps<typeof Button>) {
	return (
		<Dialog>
			<DialogTrigger render={<Button {...props} />} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Neuer Report</DialogTitle>
					<DialogDescription>Erstelle einen neuen Report</DialogDescription>
					<div className="mt-4">
						<CreateReportForm accountingUnits={[]} businessUnits={[]} />
					</div>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}

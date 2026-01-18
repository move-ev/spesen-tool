import type { ExpenseType } from "generated/prisma/enums";
import { CarIcon, ReceiptIcon, UtensilsIcon } from "lucide-react";
import type React from "react";

export function ExpenseIcon({
	type,
}: React.ComponentProps<"svg"> & { type: ExpenseType }) {
	switch (type) {
		case "RECEIPT":
			return <ReceiptIcon />;
		case "TRAVEL":
			return <CarIcon />;
		case "FOOD":
			return <UtensilsIcon />;
		default:
			return null;
	}
}

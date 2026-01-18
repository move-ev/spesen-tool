import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ReportStatus } from "@/generated/prisma/enums";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function translateReportStatus(status: ReportStatus) {
	switch (status) {
		case "DRAFT":
			return "Entwurf";
		case "PENDING_APPROVAL":
			return "In Bearbeitung";
		case "NEEDS_REVISION":
			return "Benötigt Überarbeitung";
		case "ACCEPTED":
			return "Akzeptiert";
		case "REJECTED":
			return "Abgelehnt";
	}
}

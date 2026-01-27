// Re-export shared utils from @zemio/ui
export {
	cn,
	formatBytes,
	formatIban,
	renameFileWithHash,
	unformatIban,
} from "@zemio/ui/lib/utils";

// App-specific utils (Prisma-dependent)
import {
	differenceInDays,
	differenceInHours,
	differenceInMinutes,
	format,
} from "date-fns";
import type { ExpenseType, ReportStatus } from "@/generated/prisma/enums";

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

export function translateExpenseType(type: ExpenseType) {
	switch (type) {
		case "RECEIPT":
			return "Beleg";
		case "TRAVEL":
			return "Reise";
		case "FOOD":
			return "Verpflegung";
	}
}

export function formatTimeElapsed(date: Date): string {
	const now = new Date();

	if (differenceInMinutes(now, date) < 60) {
		return `vor ${differenceInMinutes(now, date)} Minuten`;
	}

	if (differenceInHours(now, date) < 24) {
		return `vor ${differenceInHours(now, date)} Stunden`;
	}

	if (differenceInDays(now, date) < 7) {
		return `vor ${differenceInDays(now, date)} Tagen`;
	}

	return `am ${format(date, "dd.MM.yyyy")}`;
}

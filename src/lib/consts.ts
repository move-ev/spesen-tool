import { ReportStatus } from "@/generated/prisma/enums";
import type { DatePreset } from "./types";
import { translateReportStatus } from "./utils";

export const ROUTES = {
	USER_DASHBOARD: "/",
	AUTH: "/auth",
	REPORT_DETAIL: (id: string) => `/reports/${id}`,
	REPORT_NEW: "/reports/new",
	ADMIN_DASHBOARD: "/admin",
	ADMIN_SETTINGS: "/admin/settings",
	USER_SETTINGS: "/preferences",
};

export const DEFAULT_EMAIL_FROM =
	"move e.V. <noreply@transactional.consultingcontact.de>";

export const ADMIN_SETTINGS_MENU = {
	GENERAL: "/admin/settings",
	USERS: "/admin/settings/users",
	ACCOUNTING_UNITS: "/admin/settings/accounting-units",
	BUSINESS_UNITS: "/admin/settings/business-units",
	ALLOWANCES: "/admin/settings/allowances",
};

export const PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
	{ value: "LAST_7", label: "Letzte 7 Tage" },
	{ value: "LAST_30", label: "Letzte 30 Tage" },
	{ value: "LAST_90", label: "Letzte 90 Tage" },
	{ value: "CUSTOM", label: "Custom" },
];

export const DATE_FORMAT = "dd.MM.yyyy";

export const STATUS_OPTIONS = [
	{ value: "ALL", label: "Alle Status" },
	{
		value: ReportStatus.NEEDS_REVISION,
		label: translateReportStatus(ReportStatus.NEEDS_REVISION),
	},
	{
		value: ReportStatus.ACCEPTED,
		label: translateReportStatus(ReportStatus.ACCEPTED),
	},
	{
		value: ReportStatus.REJECTED,
		label: translateReportStatus(ReportStatus.REJECTED),
	},
];

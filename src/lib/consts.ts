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

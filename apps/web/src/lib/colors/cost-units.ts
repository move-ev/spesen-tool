import type { CostUnitColor } from "@zemio/db";

type CostUnitColors = Record<CostUnitColor, { fill: string; text: string }>;

export const COST_UNIT_COLORS: CostUnitColors = {
	RED: { fill: "#ef4444", text: "#dc2626" },
	ORANGE: { fill: "#f97316", text: "#f97316" },
	AMBER: { fill: "#f59e0b", text: "#f59e0b" },
	YELLOW: { fill: "#eab308", text: "#eab308" },
	LIME: { fill: "#84cc16", text: "#84cc16" },
	GREEN: { fill: "#22c55e", text: "#22c55e" },
	EMERALD: { fill: "#10b981", text: "#10b981" },
	TEAL: { fill: "#14b8a6", text: "#14b8a6" },
	CYAN: { fill: "#06b6d4", text: "#06b6d4" },
	SKY: { fill: "#0ea5e9", text: "#0ea5e9" },
	BLUE: { fill: "#3b82f6", text: "#3b82f6" },
	INDIGO: { fill: "#6366f1", text: "#6366f1" },
	VIOLET: { fill: "#8b5cf6", text: "#8b5cf6" },
	PURPLE: { fill: "#a855f7", text: "#a855f7" },
	FUCHSIA: { fill: "#d946ef", text: "#d946ef" },
	PINK: { fill: "#ec4899", text: "#ec4899" },
	ROSE: { fill: "#f43f5e", text: "#f43f5e" },
	BASE: { fill: "#64748b", text: "#64748b" },
};

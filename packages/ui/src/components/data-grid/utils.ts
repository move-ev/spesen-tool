import type { Column } from "@tanstack/react-table";
import type { CSSProperties } from "react";

function getPinningStyles<TData, TValue>(
	column: Column<TData, TValue>,
): CSSProperties {
	const isPinned = column.getIsPinned();
	if (!isPinned) return {};
	return {
		position: "sticky",
		zIndex: 1,
		left: isPinned === "left" ? column.getStart("left") : undefined,
		right: isPinned === "right" ? column.getAfter("right") : undefined,
	};
}

export { getPinningStyles };

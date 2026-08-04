import type { RouterOutputs } from "@/trpc/react";

export type AdminReport = RouterOutputs["report"]["list"]["reports"][number];

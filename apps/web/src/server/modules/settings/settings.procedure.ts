import type { PrismaClient } from "@zemio/db";
import type { SettingsServiceContext } from "./settings.service";

type SettingsRequestContext = {
	db: PrismaClient;
	organizationId: string;
};

export function toSettingsServiceContext(
	ctx: SettingsRequestContext,
): SettingsServiceContext {
	return { db: ctx.db, organizationId: ctx.organizationId };
}

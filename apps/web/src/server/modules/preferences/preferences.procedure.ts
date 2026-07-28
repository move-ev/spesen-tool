import type { PrismaClient } from "@zemio/db";
import type { PreferencesServiceContext } from "./preferences.service";

type PreferencesRequestContext = {
	db: PrismaClient;
	session: { user: { id: string } };
};

export function toPreferencesServiceContext(
	ctx: PreferencesRequestContext,
): PreferencesServiceContext {
	return { db: ctx.db, userId: ctx.session.user.id };
}

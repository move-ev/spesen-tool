import type { PrismaClient } from "@zemio/db";
import type { z } from "zod";
import type { updatePreferencesServerSchema } from "@/lib/validators";
import { mapPrismaError } from "@/server/shared/errors";
import {
	type PreferencesRepository,
	type PreferencesRow,
	preferencesRepository,
} from "./preferences.repository";

export type PreferencesServiceContext = {
	db: PrismaClient;
	userId: string;
};

type UpdatePreferencesInput = z.infer<typeof updatePreferencesServerSchema>;

export function createPreferencesService(deps: {
	repo: PreferencesRepository;
}) {
	const { repo } = deps;

	async function upsert(
		ctx: PreferencesServiceContext,
		notifications?: UpdatePreferencesInput["notificationPreference"],
	): Promise<PreferencesRow> {
		try {
			return await repo.upsert(ctx.db, { userId: ctx.userId, notifications });
		} catch (error) {
			throw mapPrismaError(error);
		}
	}

	return {
		get(ctx: PreferencesServiceContext): Promise<PreferencesRow> {
			return upsert(ctx);
		},

		update(
			ctx: PreferencesServiceContext,
			input: UpdatePreferencesInput,
		): Promise<PreferencesRow> {
			return upsert(ctx, input.notificationPreference);
		},
	};
}

export type PreferencesService = ReturnType<typeof createPreferencesService>;

export const preferencesService = createPreferencesService({
	repo: preferencesRepository,
});

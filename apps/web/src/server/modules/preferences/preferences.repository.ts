import {
	NotificationPreference,
	type Prisma,
	type PrismaClient,
} from "@zemio/db";

type Db = PrismaClient;

const preferencesSelect = {
	id: true,
	userId: true,
	notifications: true,
} satisfies Prisma.PreferencesSelect;

export type PreferencesRow = Prisma.PreferencesGetPayload<{
	select: typeof preferencesSelect;
}>;

/**
 * Preferences are created lazily, so both reading and writing upsert. Doing it
 * in one statement also removes the find-then-create race the previous
 * read path had.
 */
export const preferencesRepository = {
	upsert(
		db: Db,
		args: { userId: string; notifications?: NotificationPreference },
	): Promise<PreferencesRow> {
		return db.preferences.upsert({
			where: { userId: args.userId },
			create: {
				userId: args.userId,
				notifications: args.notifications ?? NotificationPreference.ALL,
			},
			update:
				args.notifications === undefined
					? {}
					: { notifications: args.notifications },
			select: preferencesSelect,
		});
	},
} as const;

export type PreferencesRepository = typeof preferencesRepository;

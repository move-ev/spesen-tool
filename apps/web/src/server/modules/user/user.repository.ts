import type { Prisma, PrismaClient } from "@zemio/db";

type Db = PrismaClient;

/** The account fields the app renders. Never widen this to the whole row. */
const userProfileSelect = {
	id: true,
	name: true,
	email: true,
	image: true,
} satisfies Prisma.UserSelect;

export type UserProfile = Prisma.UserGetPayload<{
	select: typeof userProfileSelect;
}>;

export const userRepository = {
	findById(db: Db, id: string): Promise<UserProfile | null> {
		return db.user.findUnique({ where: { id }, select: userProfileSelect });
	},

	updateName(db: Db, args: { id: string; name: string }): Promise<UserProfile> {
		return db.user.update({
			where: { id: args.id },
			data: { name: args.name },
			select: userProfileSelect,
		});
	},
} as const;

export type UserRepository = typeof userRepository;

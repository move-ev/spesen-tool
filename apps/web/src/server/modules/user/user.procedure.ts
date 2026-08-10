import type { PrismaClient } from "@zemio/db";
import type { UserServiceContext } from "./user.service";

type UserRequestContext = {
	db: PrismaClient;
	session: { user: { id: string } };
};

export function toUserServiceContext(
	ctx: UserRequestContext,
): UserServiceContext {
	return { db: ctx.db, userId: ctx.session.user.id };
}

import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@zemio/db";
import type { z } from "zod";
import type { updateUserNameSchema } from "@/lib/validators";
import { mapPrismaError } from "@/server/shared/errors";
import {
	type UserProfile,
	type UserRepository,
	userRepository,
} from "./user.repository";

export type UserServiceContext = {
	db: PrismaClient;
	userId: string;
};

type UpdateNameInput = z.infer<typeof updateUserNameSchema>;

export function createUserService(deps: { repo: UserRepository }) {
	const { repo } = deps;

	return {
		async get(ctx: UserServiceContext): Promise<UserProfile> {
			const user = await repo.findById(ctx.db, ctx.userId);
			if (!user) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}
			return user;
		},

		async updateName(
			ctx: UserServiceContext,
			input: UpdateNameInput,
		): Promise<UserProfile> {
			try {
				return await repo.updateName(ctx.db, {
					id: ctx.userId,
					name: input.name,
				});
			} catch (error) {
				throw mapPrismaError(error);
			}
		},
	};
}

export type UserService = ReturnType<typeof createUserService>;

export const userService = createUserService({ repo: userRepository });

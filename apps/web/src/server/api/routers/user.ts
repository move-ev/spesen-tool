import { updateUserNameSchema } from "@/lib/validators";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { toUserServiceContext, userService } from "@/server/modules/user";

export const userRouter = createTRPCRouter({
	get: protectedProcedure.query(({ ctx }) =>
		userService.get(toUserServiceContext(ctx)),
	),

	updateName: protectedProcedure
		.input(updateUserNameSchema)
		.mutation(({ ctx, input }) =>
			userService.updateName(toUserServiceContext(ctx), input),
		),
});

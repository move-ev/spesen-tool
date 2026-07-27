import { updateUserNameSchema } from "@/lib/validators";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
	getOwn: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.user.findUniqueOrThrow({
			where: { id: ctx.session.user.id },
			select: { id: true, name: true, email: true, image: true },
		});
	}),

	updateOwnName: protectedProcedure
		.input(updateUserNameSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.user.update({
				where: { id: ctx.session.user.id },
				data: { name: input.name },
				select: { id: true, name: true, email: true, image: true },
			});
		}),
});

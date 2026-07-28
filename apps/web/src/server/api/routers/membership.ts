import { createTRPCRouter, orgAdminProcedure } from "@/server/api/trpc";
import {
	membershipListInputSchema,
	membershipProcedure,
	membershipService,
	setMemberRoleSchema,
	toMembershipServiceContext,
} from "@/server/modules/membership";

export const membershipRouter = createTRPCRouter({
	list: orgAdminProcedure
		.input(membershipListInputSchema)
		.query(({ ctx, input }) =>
			membershipService.list(toMembershipServiceContext(ctx), input),
		),

	byId: membershipProcedure.query(({ ctx }) => ctx.membership),

	setRole: membershipProcedure
		.input(setMemberRoleSchema)
		.mutation(({ ctx, input }) =>
			membershipService.setRole(
				toMembershipServiceContext(ctx),
				ctx.membership,
				input,
			),
		),
});

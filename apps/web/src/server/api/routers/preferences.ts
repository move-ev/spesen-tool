import { updatePreferencesServerSchema } from "@/lib/validators";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	preferencesService,
	toPreferencesServiceContext,
} from "@/server/modules/preferences";

export const preferencesRouter = createTRPCRouter({
	get: protectedProcedure.query(({ ctx }) =>
		preferencesService.get(toPreferencesServiceContext(ctx)),
	),

	update: protectedProcedure
		.input(updatePreferencesServerSchema)
		.mutation(({ ctx, input }) =>
			preferencesService.update(toPreferencesServiceContext(ctx), input),
		),
});

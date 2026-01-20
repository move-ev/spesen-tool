import { adminRouter } from "@/server/api/routers/admin";
import { expenseRouter } from "@/server/api/routers/expense";
import { reportRouter } from "@/server/api/routers/report";
import { settingsRouter } from "@/server/api/routers/settings";
import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { accountingUnitRouter } from "./routers/accounting-unit";
import { preferencesRouter } from "./routers/preferences";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	report: reportRouter,
	expense: expenseRouter,
	settings: settingsRouter,
	preferences: preferencesRouter,
	user: userRouter,
	admin: adminRouter,
	accountingUnit: accountingUnitRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

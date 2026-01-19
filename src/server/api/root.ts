import { adminRouter } from "@/server/api/routers/admin";
import { expenseRouter } from "@/server/api/routers/expense";
import { pdfTestRouter } from "@/server/api/routers/pdfTest";
import { reportRouter } from "@/server/api/routers/report";
import { settingsRouter } from "@/server/api/routers/settings";
import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	report: reportRouter,
	expense: expenseRouter,
	settings: settingsRouter,
	user: userRouter,
	admin: adminRouter,
	pdfTest: pdfTestRouter,
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

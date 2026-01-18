import { toRouteHandler } from "@better-upload/server/adapters/next";
import { router } from "@/server/better-upload";

export const { POST } = toRouteHandler(router);

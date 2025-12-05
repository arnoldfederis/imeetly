import type { InferRouterOutputs, RouterClient } from "@orpc/server";
import { healthRouter } from "@shared/rpc/routers/health";

export const appRouter = {
  health: healthRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
export type RouterOutputs = InferRouterOutputs<typeof appRouter>;

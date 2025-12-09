import { type InferRouterOutputs, lazy, type RouterClient } from "@orpc/server";

export const appRouter = {
  auth: lazy(() => import("./routers/auth")),
  health: lazy(() => import("./routers/health")),
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
export type RouterOutputs = InferRouterOutputs<typeof appRouter>;

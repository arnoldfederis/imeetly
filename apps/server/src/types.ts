import type { InferRouterOutputs, RouterClient } from "@orpc/server";
import type { appRouter } from "@repo/server/router";
import type { app } from "./index";

export type App = typeof app;
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
export type RouterOutputs = InferRouterOutputs<typeof appRouter>;

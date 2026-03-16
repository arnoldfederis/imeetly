import { lazy } from "@orpc/server";

export const appRouter = {
  auth: lazy(() => import("./modules/auth")),
  health: lazy(() => import("./modules/health")),
  user: lazy(() => import("./modules/user")),
};

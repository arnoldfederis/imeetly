import { lazy } from "@orpc/server";

export const appRouter = {
  auth: lazy(() => import("./modules/auth")),
  health: lazy(() => import("./modules/health")),
  user: lazy(() => import("./modules/user")),
  meeting: lazy(() => import("./modules/meeting")),
  actionItem: lazy(() => import("./modules/action-item")),
  billing: lazy(() => import("./modules/billing")),
};

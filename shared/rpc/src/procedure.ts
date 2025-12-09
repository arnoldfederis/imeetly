import { authMiddleware } from "@shared/rpc/middlewares/auth";
import { rateLimit } from "@shared/rpc/middlewares/rate-limit";
import { base } from "./context";

export const protectedProcedure = base.use(authMiddleware).use(rateLimit);
export const publicProcedure = base.use(rateLimit);

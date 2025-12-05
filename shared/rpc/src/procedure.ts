import { base } from "./context";
import { authMiddleware } from "./middlewares/auth";

export const protectedProcedure = base.use(authMiddleware);
export const publicProcedure = base;

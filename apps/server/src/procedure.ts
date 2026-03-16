import { ORPCError, os } from "@orpc/server";
import { auth } from "@repo/server/lib/auth";

export const base = os.$context();
export const authMiddleware = base.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({
    headers: context.headers,
  });

  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Unauthorized",
    });
  }

  return next({
    context: {
      user: session.user,
      session: session.session,
    },
  });
});

export const privateProcedure = base.use(authMiddleware);
export const publicProcedure = base;

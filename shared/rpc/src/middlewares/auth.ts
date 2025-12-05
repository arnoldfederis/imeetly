import { ORPCError } from "@orpc/client";
import { base } from "@shared/rpc/context";
import { auth } from "@shared/rpc/lib/auth";

export const authMiddleware = base.middleware(async ({ context, next }) => {
  const sessionData = await auth.api.getSession({
    headers: context.headers,
  });

  if (!(sessionData?.session && sessionData?.user)) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      session: sessionData.session,
      user: sessionData.user,
    },
  });
});

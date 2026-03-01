import { auth } from "@repo/server/lib/auth";
import { Elysia } from "elysia";

export const authMacro = new Elysia().macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({
        headers,
      });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});

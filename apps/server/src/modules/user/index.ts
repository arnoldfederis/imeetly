import { authMacro } from "@repo/server/modules/auth/macro";
import { Elysia, t } from "elysia";

export const userController = new Elysia()
  .use(authMacro)
  .get("/me", ({ user }) => user, { auth: true })
  .get("/hi", () => "Hello Elysia", { auth: true })
  .post("/echo", ({ body }) => body, {
    body: t.Object({
      message: t.String(),
    }),
  });

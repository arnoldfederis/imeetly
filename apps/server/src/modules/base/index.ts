import { env } from "@repo/env";
import { auth } from "@repo/server/lib/auth";
import { authController } from "@repo/server/modules/auth";
import { healthController } from "@repo/server/modules/health";
import { userController } from "@repo/server/modules/user";
import { Elysia } from "elysia";

export const baseController = new Elysia()
  .trace(async ({ onHandle }) => {
    await onHandle(async ({ begin, onStop }) => {
      await onStop(({ end }) => {
        console.log("handle took", end - begin, "ms");
      });
    });
  })
  .get("/", ({ redirect }) => redirect(env.APP_BASE_URL))
  .mount(auth.handler)
  .use(authController)
  .use(healthController)
  .use(userController);

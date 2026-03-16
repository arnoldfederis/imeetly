import { base, privateProcedure } from "@repo/server/procedure";
import { z } from "zod";

export const userController = base.router({
  me: privateProcedure.handler(async ({ context }) => context.user),
  hi: privateProcedure.handler(() => "Hello Elysia"),
  echo: privateProcedure
    .input(
      z.object({
        message: z.string(),
      }),
    )
    .handler(({ input }) => input),
});

export default userController;

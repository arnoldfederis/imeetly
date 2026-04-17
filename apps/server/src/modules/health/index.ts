import { env } from "@repo/env";
import { base, publicProcedure } from "@repo/server/procedure";

export const healthController = base.prefix("/health").router({
  ready: publicProcedure
    .route({ path: "/ready", method: "GET" })
    .handler(() => {
      if (env) {
        return { message: "Server is up and running." };
      }

      throw new Error("Server is not ready yet.");
    }),
  live: publicProcedure
    .route({ path: "/live", method: "GET" })
    .handler(() => ({ message: "Server is alive." })),
});

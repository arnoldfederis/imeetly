import { env } from "@repo/env";
import { Elysia } from "elysia";

export const healthController = new Elysia({ prefix: "/health" })
  .get("/ready", ({ status }) => {
    if (env) {
      return status(200, { message: "Server is up and running." });
    }

    throw new Error("Server is not ready yet.");
  })
  .get("/live", ({ status }) => status(200, { message: "Server is alive." }));

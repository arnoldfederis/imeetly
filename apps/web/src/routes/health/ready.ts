import { env } from "@repo/env";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/health/ready")({
  server: {
    handlers: {
      GET: () => {
        if (env) {
          return new Response("Web is up and running.", { status: 200 });
        }

        throw new Error("Web service unavailable.");
      },
    },
  },
});

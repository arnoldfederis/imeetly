import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { env } from "@shared/rpc/env";
import type { appRouter } from "@shared/rpc/router";

declare global {
  var $server: RouterClient<typeof appRouter> | undefined;
}

const link = new RPCLink({
  url: `${typeof window !== "undefined" ? window.location.origin : env.APP_BASE_URL}/rpc`,
  headers: async () => {
    if (typeof window !== "undefined") {
      return {};
    }

    const { headers } = await import("next/headers");
    return await headers();
  },
});

/**
 * Fallback to client-side client if server-side client is not available.
 */
export const server: RouterClient<typeof appRouter> =
  globalThis.$server ?? createORPCClient(link);
export const client = createTanstackQueryUtils(server);

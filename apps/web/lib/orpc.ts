import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { env } from "@repo/env/web";
import type { AppRouterClient } from "@repo/server/types";

declare global {
  var $server: AppRouterClient | undefined;
}

const link = new RPCLink({
  url: `${env.NEXT_PUBLIC_APP_SERVER_URL}/rpc`,
  headers: async () => {
    if (typeof window !== "undefined") {
      return {};
    }

    const { headers } = await import("next/headers");
    return await headers();
  },
  fetch: (request, init) => {
    return globalThis.fetch(request, {
      ...init,
      credentials: "include",
      mode: "cors",
    });
  },
});

export const server: AppRouterClient =
  globalThis.$server ?? createORPCClient(link);
export const client = createTanstackQueryUtils(server);

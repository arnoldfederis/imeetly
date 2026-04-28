import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { env } from "@repo/env";
import type { AppRouterClient } from "@repo/server/types";

function getRpcUrl() {
  if (typeof window !== "undefined") {
    return `${env.NEXT_PUBLIC_APP_SERVER_URL}/rpc`;
  }

  if (env.APP_ENV === "development") {
    return `http://127.0.0.1:${env.SERVER_PORT}/rpc`;
  }

  return `${env.NEXT_PUBLIC_APP_SERVER_URL}/rpc`;
}

const link = new RPCLink({
  url: getRpcUrl(),
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

export const server: AppRouterClient = createORPCClient(link);
export const client = createTanstackQueryUtils(server);

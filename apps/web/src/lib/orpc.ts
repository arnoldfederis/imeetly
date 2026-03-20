import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { clientEnv } from "@repo/env";
import { appRouter } from "@repo/server/router";
import type { AppRouter } from "@repo/server/types";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(appRouter, {
      /**
       * Provide initial context if needed.
       *
       * Because this client instance is shared across all requests,
       * only include context that's safe to reuse globally.
       * For per-request context, use middleware context or pass a function as the initial context.
       */
      context: async () => ({
        headers: getRequestHeaders(), // provide headers if initial context required
      }),
    }),
  )
  .client((): RouterClient<AppRouter> => {
    const link = new RPCLink({
      url: `${clientEnv.VITE_SERVER_URL}/rpc`,
      fetch: (request, init) => {
        return globalThis.fetch(request, {
          ...init,
          credentials: "include",
          mode: "cors",
        });
      },
    });

    return createORPCClient(link);
  });

export const server = getORPCClient();
export const client = createTanstackQueryUtils(server);

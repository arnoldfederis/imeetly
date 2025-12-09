import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import {
  BatchLinkPlugin,
  DedupeRequestsPlugin,
  SimpleCsrfProtectionLinkPlugin,
} from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { env } from "@shared/rpc/env";
import type { appRouter } from "@shared/rpc/router";

declare global {
  var $server: RouterClient<typeof appRouter> | undefined;
}

const link = new RPCLink({
  url: `${env.NEXT_PUBLIC_SERVER_URL}/rpc`,
  fetch: (request, init, { context }) =>
    globalThis.fetch(request, {
      ...init,
      cache: context?.cache,
      credentials: "include",
    }),
  method: ({ context }) => {
    if (context?.cache) {
      return "GET";
    }

    return "POST";
  },
  headers: async () => {
    if (typeof window !== "undefined") {
      return {};
    }

    const { headers } = await import("next/headers");
    return await headers();
  },
  plugins: [
    new BatchLinkPlugin({
      mode: typeof window === "undefined" ? "buffered" : "streaming",
      groups: [
        {
          condition: ({ context }) => context?.cache === "force-cache",
          context: {
            // This context will be passed to the fetch method
            cache: "force-cache",
          },
        },
        {
          // Fallback for all other requests - need to put it at the end of the list
          condition: () => true,
          context: {},
        },
      ],
    }),
    new DedupeRequestsPlugin({
      filter: ({ request }) => request.method === "GET", // Filters requests to dedupe
      groups: [
        {
          condition: ({ context }) => context?.cache === "force-cache",
          context: {
            cache: "force-cache",
          },
        },
        {
          // Fallback group – placed last to catch remaining requests
          condition: () => true,
          context: {},
        },
      ],
    }),
    new SimpleCsrfProtectionLinkPlugin({
      headerValue: env.NEXT_PUBLIC_X_CSRF_TOKEN_VALUE,
    }),
  ],
});

/**
 * Fallback to client-side client if server-side client is not available.
 */
export const server: RouterClient<typeof appRouter> =
  globalThis.$server ?? createORPCClient(link);
export const client = createTanstackQueryUtils(server);

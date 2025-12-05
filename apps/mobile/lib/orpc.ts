import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { appRouter } from "@shared/rpc/router";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.log(error);
    },
  }),
});

const link = new RPCLink({
  url: `${process.env.EXPO_PUBLIC_SERVER_URL}/rpc`,
  headers() {
    const headers = new Map<string, string>();
    const cookies = authClient.getCookie();
    if (cookies) {
      headers.set("Cookie", cookies);
    }
    return Object.fromEntries(headers);
  },
  async fetch(request, init) {
    const { fetch } = await import("expo/fetch");

    return await fetch(request.url, {
      body: await request.blob(),
      headers: request.headers,
      method: request.method,
      signal: request.signal,
      ...init,
    });
  },
});

export const server: RouterClient<typeof appRouter> = createORPCClient(link);
export const client = createTanstackQueryUtils(server);

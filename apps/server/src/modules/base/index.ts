import { onError } from "@orpc/server";
import { CompressionPlugin, RPCHandler } from "@orpc/server/fetch";
import { env } from "@repo/env";
import { auth } from "@repo/server/lib/auth";
import { appRouter } from "@repo/server/router";
import { Elysia } from "elysia";

export const rpcHandler = new RPCHandler(appRouter, {
  plugins: [new CompressionPlugin()],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const baseController = new Elysia()
  .get("/", ({ redirect }) => redirect(env.APP_BASE_URL))
  .all(
    "/rpc*",
    async ({ request }: { request: Request }) => {
      const { response } = await rpcHandler.handle(request, {
        prefix: "/rpc",
        context: {
          headers: request.headers,
        },
      });

      return response ?? new Response("Not Found", { status: 404 });
    },
    { parse: "none" },
  )
  .all(
    "/api/auth/*",
    async ({ request, set }: { request: Request; set: any }) => {
      const response = await auth.handler(request);
      // Copy auth response headers/status so Elysia's CORS plugin can add its headers
      for (const [key, value] of response.headers) {
        set.headers[key] = value;
      }
      set.status = response.status;

      console.log(env.CORS_ORIGIN, `here... ${env.CORS_ORIGIN}`);
      return response.text();
    },
  );

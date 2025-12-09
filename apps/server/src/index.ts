import { env } from "@shared/rpc/env";
import { auth } from "@shared/rpc/lib/auth";
import pino from "pino";
import pretty from "pino-pretty";
import { apiHandler, rpcHandler } from "@/handler";

const logger = pino(env.APP_ENV === "development" ? pretty() : undefined);

Bun.serve({
  port: env.API_PORT,
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const start = performance.now();
    const requestId = crypto.randomUUID();

    try {
      let response: Response;

      if (url.pathname.startsWith("/api/auth")) {
        response = await auth.handler(request);
      } else {
        const context = { headers: request.headers, request };
        const rpcResult = await rpcHandler.handle(request, {
          prefix: "/rpc",
          context,
        });

        if (rpcResult.matched) {
          response = rpcResult.response;
        } else {
          const apiResult = await apiHandler.handle(request, {
            prefix: "/api",
            context,
          });
          response = apiResult.matched
            ? apiResult.response
            : new Response("Not Found", { status: 404 });
        }
      }

      logger.info({
        request: {
          url: url.pathname,
          method: request.method,
          headers: request.headers,
        },
        response: {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            "x-request-id": requestId,
          },
        },
        requestId,
        responseTime: Math.round(performance.now() - start),
      });

      return response;
    } catch (error) {
      logger.error({ error, requestId }, "Handler error");
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Server is running at ${env.APP_BASE_URL} 🔥`);

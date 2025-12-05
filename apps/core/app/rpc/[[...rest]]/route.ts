import { LoggingHandlerPlugin } from "@orpc/experimental-pino";
import { onError } from "@orpc/server";
import { CompressionPlugin, RPCHandler } from "@orpc/server/fetch";
import { env } from "@shared/rpc/env";
import { appRouter } from "@shared/rpc/router";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import pino from "pino";
import pretty from "pino-pretty";

const logger = pino(env.APP_ENV === "development" ? pretty() : undefined);
const handler = new RPCHandler(appRouter, {
  plugins: [
    new CompressionPlugin(),
    new LoggingHandlerPlugin({
      logger, // Custom logger instance
      generateId: () => crypto.randomUUID(), // Custom ID generator
      logRequestResponse: true, // Log request start/end (disabled by default)
      logRequestAbort: true, // Log when requests are aborted (disabled by default)
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

async function handleRequest(req: NextRequest) {
  const { response } = await handler.handle(req, {
    prefix: "/rpc",
    context: {
      headers: await headers(),
    },
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;

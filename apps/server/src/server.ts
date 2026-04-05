import { wrap } from "@bogeychan/elysia-logger";
import cors from "@elysiajs/cors";
import { env } from "@repo/env";
import { ensureBucketCors } from "@repo/server/lib/s3";
import { baseController } from "@repo/server/modules/base";
import { Elysia } from "elysia";
import pino from "pino";
import pretty from "pino-pretty";

const logger = pino(env.APP_ENV === "development" ? pretty() : undefined);

export const app = new Elysia()
  .use(wrap(logger, {}))
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      allowedHeaders: env.CORS_ALLOW_HEADERS.split(","),
      methods: env.CORS_ALLOW_METHODS.split(","),
      credentials: Boolean(env.CORS_ALLOW_CREDENTIALS),
      maxAge: Number(env.CORS_MAX_AGE),
    }),
  )
  .use(baseController)
  .listen(Number(env.SERVER_PORT));

console.log(`Server is running at ${env.SERVER_URL} 🔥 🦊`);

// Configure S3 bucket CORS on startup (non-blocking)
ensureBucketCors();

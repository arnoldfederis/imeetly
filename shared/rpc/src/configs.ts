import { env } from "@shared/rpc/env";

export const configs = {
  cors: {
    origin: env.CORS_ORIGIN.split(","),
    allowMethods: env.CORS_ALLOW_METHODS.split(","),
    allowHeaders: env.CORS_ALLOW_HEADERS.split(","),
    credentials: Boolean(env.CORS_ALLOW_CREDENTIALS),
    maxAge: Number(env.CORS_MAX_AGE),
  },
  rateLimit: {
    maxRequests: 3,
    windowMs: 60_000,
    windowSc: 60,
  },
};

import { wrap } from "@bogeychan/elysia-logger";
import cors from "@elysiajs/cors";
import { env } from "@repo/env";
import { baseController } from "@repo/server/modules/base";
import { publicMeetingRouter } from "@repo/server/modules/meeting/public.router";
import { memoryStreamRouter } from "@repo/server/modules/memory/stream";
import { Elysia } from "elysia";
import pino from "pino";
import pretty from "pino-pretty";

const pinoOptions: pino.LoggerOptions = {
  formatters: {
    log(obj: Record<string, unknown>) {
      const store = obj.store as { responseTime?: number } | undefined;
      const set = obj.set as { status?: number } | undefined;
      const out: Record<string, unknown> = {
        path: obj.path,
        route: obj.route,
        status: set?.status ?? 200,
        ms:
          store?.responseTime != null
            ? +store.responseTime.toFixed(2)
            : undefined,
        isError: obj.isError,
      };
      if (obj.err) out.err = obj.err;
      return out;
    },
  },
};

const logger = pino(
  pinoOptions,
  env.APP_ENV === "development" ? pretty() : undefined,
);

// Simple per-IP sliding-window rate limiter (100 req / 60 s)
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Evict expired entries every 5 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 5 * 60_000).unref();

// Retry Google Meet recordings not yet ready at time of push notification
setInterval(async () => {
  try {
    const { retryPendingGoogleRecordings } = await import(
      "./modules/integration/webhook"
    );
    await retryPendingGoogleRecordings();
  } catch (err) {
    console.error("[bg] Google recording retry error:", err);
  }
}, 5 * 60_000).unref();

// Renew Google Calendar watch channels expiring within 24h
setInterval(
  async () => {
    try {
      const { WatchService } = await import(
        "./modules/integration/watch.service"
      );
      await WatchService.renewExpiringGoogleChannels();
    } catch (err) {
      console.error("[bg] Google watch renewal error:", err);
    }
  },
  6 * 60 * 60_000,
).unref();

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
  // Rate limiting
  .onBeforeHandle(({ request, set }) => {
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(ip)) {
      set.status = 429;
      return { message: "Too many requests. Please try again later." };
    }
  })
  // Security headers on every response
  .onAfterHandle(({ set }) => {
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains; preload";
    set.headers["Permissions-Policy"] =
      "camera=(), microphone=(), geolocation=()";
    set.headers["Content-Security-Policy"] =
      "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; font-src 'self' https: data:; frame-ancestors 'none'";
  })
  .use(publicMeetingRouter)
  .use(memoryStreamRouter)
  .use(baseController)
  .listen(Number(env.SERVER_PORT));

console.log(`Server is running at ${env.SERVER_URL} 🔥 🦊`);

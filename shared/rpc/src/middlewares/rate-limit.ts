import { createRatelimitMiddleware } from "@orpc/experimental-ratelimit";
import { RedisRatelimiter } from "@orpc/experimental-ratelimit/redis";
import { configs } from "@shared/rpc/configs";
import { redis } from "@shared/rpc/lib/redis";

const limiter = new RedisRatelimiter({
  eval: async (script, numKeys, ...rest) =>
    redis.eval(script, numKeys, ...rest),
  maxRequests: configs.rateLimit.maxRequests,
  window: configs.rateLimit.windowMs,
});

export const rateLimit = createRatelimitMiddleware({
  limiter: () => limiter,
  key: ({ context }) => {
    const url = new URL(context.request.url);
    return `${url.hostname}${url.pathname}`;
  },
});

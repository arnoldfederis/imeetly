import { configs } from "@shared/rpc/configs";
import { db } from "@shared/rpc/db";
import { schema } from "@shared/rpc/db/schema";
import { env } from "@shared/rpc/env";
import { authPlugins } from "@shared/rpc/lib/auth-plugins";
import { redis } from "@shared/rpc/lib/redis";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";

export const auth = betterAuth({
  advanced: {
    cookies: {
      session_token: {
        name: env.AUTH_TOKEN_NAME,
      },
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
    cookiePrefix: env.AUTH_TOKEN_NAME,
  },
  appName: env.APP_NAME,
  baseURL: env.APP_BASE_URL,
  database: drizzleAdapter(db, {
    schema,
    provider: "pg",
    usePlural: true,
  }),
  plugins: authPlugins,
  rateLimit: {
    enabled: true,
    window: configs.rateLimit.windowSc,
    max: configs.rateLimit.maxRequests,
  },
  secondaryStorage: {
    get: async (key) => await redis.get(key),
    set: async (key, value, ttl) => {
      if (ttl) {
        await redis.set(key, value, "EX", ttl);
      } else {
        await redis.set(key, value);
      }
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
  socialProviders: {
    google: {
      accessType: "offline",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
  trustedOrigins: [env.CORS_ORIGIN, "mobile://", "exp://"],
});

import { db, schema } from "@repo/db";
import { env } from "@repo/env";
import { authPlugins } from "@repo/server/lib/auth-plugins";
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
    crossSubDomainCookies: {
      enabled: true,
      domain: env.DOMAIN_NAME,
    },
  },
  appName: env.APP_NAME,
  baseURL: env.SERVER_URL,
  database: drizzleAdapter(db, {
    schema,
    provider: "pg",
    usePlural: true,
  }),
  plugins: authPlugins,
  socialProviders: {
    google: {
      accessType: "offline",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
  trustedOrigins: [env.CORS_ORIGIN],
});

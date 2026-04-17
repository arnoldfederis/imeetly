import { db, schema } from "@repo/db";
import { env } from "@repo/env";
import { authPlugins } from "@repo/server/lib/auth-plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";

function resolveAuthBaseUrl() {
  const candidates = [
    process.env.BETTER_AUTH_URL,
    env.SERVER_URL,
    env.APP_BASE_URL,
    env.NEXT_PUBLIC_APP_BASE_URL,
  ];

  for (const value of candidates) {
    if (!value) continue;

    try {
      return new URL(value).toString().replace(/\/$/, "");
    } catch {
      continue;
    }
  }

  return "http://localhost:3000";
}

function resolveAuthSecret() {
  return (
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "build-only-better-auth-secret-change-me"
  );
}

function resolveGoogleProvider() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return {};
  }

  return {
    google: {
      accessType: "offline" as const,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account" as const,
    },
  };
}

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
    useSecureCookies: true,
  },
  trustedProxyOrigins: [env.SERVER_URL],
  appName: env.APP_NAME,
  baseURL: resolveAuthBaseUrl(),
  database: drizzleAdapter(db, {
    schema,
    provider: "pg",
    usePlural: true,
  }),
  plugins: authPlugins,
  secret: resolveAuthSecret(),
  socialProviders: resolveGoogleProvider(),
  trustedOrigins: [env.CORS_ORIGIN],
});

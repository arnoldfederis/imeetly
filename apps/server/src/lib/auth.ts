import { db, schema } from "@repo/db";
import { sessions, users } from "@repo/db/schemas/auth";
import { env } from "@repo/env";
import { authPlugins } from "@repo/server/lib/auth-plugins";
import { emailService } from "@repo/server/lib/mailer";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { count, eq } from "drizzle-orm";

function resolveAuthBaseUrl() {
  const candidates = [
    process.env.BETTER_AUTH_URL,
    env.SERVER_URL,
    env.NEXT_PUBLIC_APP_SERVER_URL,
  ];

  for (const value of candidates) {
    if (!value) continue;

    try {
      return new URL(value).toString().replace(/\/$/, "");
    } catch {}
  }

  return "http://localhost:4000";
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
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          const [row] = await db
            .select({ total: count() })
            .from(sessions)
            .where(eq(sessions.userId, session.userId));

          if ((row?.total ?? 0) !== 1) return;

          const user = await db.query.users.findFirst({
            where: eq(users.id, session.userId),
          });

          if (!user) return;

          emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
            console.error(
              "[auth] Welcome email failed:",
              err instanceof Error ? err.message : err,
            );
          });
        },
      },
    },
  },
});

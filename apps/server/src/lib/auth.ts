import { db, schema } from "@repo/db";
import type { users } from "@repo/db/schemas/auth";
import { env } from "@repo/env";
import { authPlugins } from "@repo/server/lib/auth-plugins";
import { emailService } from "@repo/server/lib/mailer";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";

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
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    maxPasswordLength: 24,
    minPasswordLength: 10,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, token }) =>
      emailService.sendResetPasswordEmail(user.email, token),
    onPasswordReset: async ({ user }) =>
      void emailService.sendPasswordResetSuccessEmail(user.email),
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignIn: true,
    sendOnSignUp: true,
  },
  plugins: authPlugins,
  secret: resolveAuthSecret(),
  socialProviders: resolveGoogleProvider(),
  trustedOrigins: [env.CORS_ORIGIN],
  databaseHooks: {
    user: {
      update: {
        after: createOrUpdateHook,
      },
      create: {
        after: createOrUpdateHook,
      },
    },
  },
});

async function createOrUpdateHook(user: typeof users.$inferInsert) {
  if (!user) {
    return;
  }

  if (user.isAnonymous) {
    return;
  }

  if (user.emailVerified) {
    emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error(
        "[auth] Welcome email failed:",
        err instanceof Error ? err.message : err,
      );
    });
  }
}

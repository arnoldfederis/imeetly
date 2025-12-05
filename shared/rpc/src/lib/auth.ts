import { db } from "@shared/rpc/db";
import { schema } from "@shared/rpc/db/schema";
import { env } from "@shared/rpc/env";
import { authPlugins } from "@shared/rpc/lib/auth-plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";

export const auth = betterAuth({
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  appName: env.APP_NAME,
  baseURL: env.APP_BASE_URL,
  database: drizzleAdapter(db, {
    schema,
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: authPlugins,
  trustedOrigins: [env.APP_BASE_URL, "mobile://", "exp://"],
});

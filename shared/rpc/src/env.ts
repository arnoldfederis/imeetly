import { createEnv } from "@t3-oss/env-nextjs";
import { minLength, string } from "zod/mini";

export const env = createEnv({
  server: {
    APP_BASE_URL: string().check(minLength(1, "APP_BASE_URL is required")),
    APP_ENV: string().check(minLength(1, "APP_ENV is required")),
    APP_MODULE: string().check(minLength(1, "APP_MODULE is required")),
    APP_NAME: string().check(minLength(1, "APP_NAME is required")),
    API_PORT: string().check(minLength(1, "API_PORT is required")),
    DATABASE_URL: string().check(minLength(1, "DATABASE_URL is required")),
    POLAR_ACCESS_TOKEN: string().check(
      minLength(1, "POLAR_ACCESS_TOKEN is required")
    ),
    POLAR_WEBHOOK_SECRET: string().check(
      minLength(1, "POLAR_WEBHOOK_SECRET is required")
    ),
    RESEND_API_KEY: string().check(minLength(1, "RESEND_API_KEY is required")),
  },
  client: {
    NEXT_PUBLIC_APP_BASE_URL: string().check(
      minLength(1, "NEXT_PUBLIC_APP_BASE_URL is required")
    ),
  },
  shared: {},
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL,
  },
});

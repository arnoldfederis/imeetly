import { createEnv } from "@t3-oss/env-core";
import { minLength, object, string } from "zod/mini";

export const env = createEnv({
  server: {
    APP_BASE_URL: string().check(minLength(1, "APP_BASE_URL is required")),
    APP_ENV: string().check(minLength(1, "APP_ENV is required")),
    APP_MODULE: string().check(minLength(1, "APP_MODULE is required")),
    APP_NAME: string().check(minLength(1, "APP_NAME is required")),
    AUTH_TOKEN_NAME: string().check(
      minLength(1, "AUTH_TOKEN_NAME is required")
    ),
    CORS_ORIGIN: string().check(minLength(1, "CORS_ORIGIN is required")),
    CORS_ALLOW_METHODS: string().check(
      minLength(1, "CORS_ALLOW_METHODS is required")
    ),
    CORS_ALLOW_HEADERS: string().check(
      minLength(1, "CORS_ALLOW_HEADERS is required")
    ),
    CORS_ALLOW_CREDENTIALS: string().check(
      minLength(1, "CORS_ALLOW_CREDENTIALS is required")
    ),
    CORS_MAX_AGE: string().check(minLength(1, "CORS_MAX_AGE is required")),
    DATABASE_URL: string().check(minLength(1, "DATABASE_URL is required")),
    GOOGLE_CLIENT_ID: string().check(
      minLength(1, "GOOGLE_CLIENT_ID is required")
    ),
    GOOGLE_CLIENT_SECRET: string().check(
      minLength(1, "GOOGLE_CLIENT_SECRET is required")
    ),
    POLAR_ACCESS_TOKEN: string().check(
      minLength(1, "POLAR_ACCESS_TOKEN is required")
    ),
    POLAR_WEBHOOK_SECRET: string().check(
      minLength(1, "POLAR_WEBHOOK_SECRET is required")
    ),
    RESEND_API_KEY: string().check(minLength(1, "RESEND_API_KEY is required")),
    DOMAIN_NAME: string().check(minLength(1, "DOMAIN_NAME is required")),
    SERVER_PORT: string().check(minLength(1, "SERVER_PORT is required")),
    SERVER_URL: string().check(minLength(1, "SERVER_URL is required")),
  },
  runtimeEnv: process.env,
});

export const clientEnv = object({
  VITE_APP_BASE_URL: string().check(
    minLength(1, "VITE_APP_BASE_URL is required")
  ),
  VITE_SERVER_URL: string().check(minLength(1, "VITE_SERVER_URL is required")),
}).parse(import.meta.env);

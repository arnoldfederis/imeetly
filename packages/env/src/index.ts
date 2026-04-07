import { createEnv } from "@t3-oss/env-core";
import { minLength, object, optional, string } from "zod/mini";

export const env = createEnv({
  server: {
    APP_BASE_URL: string().check(minLength(1, "APP_BASE_URL is required")),
    APP_ENV: string().check(minLength(1, "APP_ENV is required")),
    APP_MODULE: string().check(minLength(1, "APP_MODULE is required")),
    APP_NAME: string().check(minLength(1, "APP_NAME is required")),
    AUTH_TOKEN_NAME: string().check(
      minLength(1, "AUTH_TOKEN_NAME is required"),
    ),
    CORS_ORIGIN: string().check(minLength(1, "CORS_ORIGIN is required")),
    CORS_ALLOW_METHODS: string().check(
      minLength(1, "CORS_ALLOW_METHODS is required"),
    ),
    CORS_ALLOW_HEADERS: string().check(
      minLength(1, "CORS_ALLOW_HEADERS is required"),
    ),
    CORS_ALLOW_CREDENTIALS: string().check(
      minLength(1, "CORS_ALLOW_CREDENTIALS is required"),
    ),
    CORS_MAX_AGE: string().check(minLength(1, "CORS_MAX_AGE is required")),
    DATABASE_URL: string().check(minLength(1, "DATABASE_URL is required")),
    GOOGLE_CLIENT_ID: string().check(
      minLength(1, "GOOGLE_CLIENT_ID is required"),
    ),
    GOOGLE_CLIENT_SECRET: string().check(
      minLength(1, "GOOGLE_CLIENT_SECRET is required"),
    ),
    POLAR_ACCESS_TOKEN: string().check(
      minLength(1, "POLAR_ACCESS_TOKEN is required"),
    ),
    POLAR_WEBHOOK_SECRET: string().check(
      minLength(1, "POLAR_WEBHOOK_SECRET is required"),
    ),
    RESEND_API_KEY: string().check(minLength(1, "RESEND_API_KEY is required")),
    DOMAIN_NAME: string().check(minLength(1, "DOMAIN_NAME is required")),
    SERVER_PORT: string().check(minLength(1, "SERVER_PORT is required")),
    SERVER_URL: string().check(minLength(1, "SERVER_URL is required")),
    S3_ENDPOINT: string().check(minLength(1, "S3_ENDPOINT is required")),
    S3_ACCESS_KEY_ID: string().check(
      minLength(1, "S3_ACCESS_KEY_ID is required"),
    ),
    S3_SECRET_ACCESS_KEY: string().check(
      minLength(1, "S3_SECRET_ACCESS_KEY is required"),
    ),
    S3_BUCKET: string().check(minLength(1, "S3_BUCKET is required")),
    S3_REGION: string().check(minLength(1, "S3_REGION is required")),
    TEMPORAL_ADDRESS: string().check(
      minLength(1, "TEMPORAL_ADDRESS is required"),
    ),
    TEMPORAL_NAMESPACE: string().check(
      minLength(1, "TEMPORAL_NAMESPACE is required"),
    ),
    TEMPORAL_HTTP_URL: optional(string()),
    // AI Provider Keys (optional - providers are skipped if missing)
    OPENAI_API_KEY: optional(string()),
    ANTHROPIC_API_KEY: optional(string()),
    GROQ_API_KEY: optional(string()),
    // AI Provider Selection
    AI_TRANSCRIPTION_PROVIDER: optional(string()),
    AI_EXTRACTION_PROVIDER: optional(string()),
    AI_TRANSCRIPTION_FALLBACK: optional(string()),
    AI_EXTRACTION_FALLBACK: optional(string()),
    SMTP_HOST: optional(string()),
    SMTP_PORT: optional(string()),
    SMTP_USER: optional(string()),
    SMTP_PASS: optional(string()),
  },
  runtimeEnv: process.env,
});

const clientSchema = object({
  VITE_APP_BASE_URL: string().check(
    minLength(1, "VITE_APP_BASE_URL is required"),
  ),
  VITE_SERVER_URL: string().check(minLength(1, "VITE_SERVER_URL is required")),
});

// During SSR, VITE_* vars are not in import.meta.env — read from process.env instead.
const isSSR = typeof window === "undefined";
export const clientEnv = isSSR
  ? ({
      VITE_APP_BASE_URL:
        process.env.VITE_APP_BASE_URL ?? import.meta.env.VITE_APP_BASE_URL,
      VITE_SERVER_URL:
        process.env.VITE_SERVER_URL ?? import.meta.env.VITE_SERVER_URL,
    } as { VITE_APP_BASE_URL: string; VITE_SERVER_URL: string })
  : clientSchema.parse(import.meta.env);

// Helper functions for environment checks (use functions to avoid accessing server env at module load on the client)
export const isProduction = () => env.APP_ENV === "production";
export const isDevelopment = () => env.APP_ENV === "development";

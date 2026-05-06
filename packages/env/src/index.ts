import { createEnv } from "@t3-oss/env-nextjs";
import { minLength, optional, string } from "zod/mini";

export const env = createEnv({
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
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
    PRO_MONTHLY_PLAN: string().check(
      minLength(1, "PRO_MONTHLY_PLAN is required"),
    ),
    PRO_YEARLY_PLAN: string().check(
      minLength(1, "PRO_YEARLY_PLAN is required"),
    ),
    TEAM_MONTHLY_PLAN: string().check(
      minLength(1, "TEAM_MONTHLY_PLAN is required"),
    ),
    TEAM_YEARLY_PLAN: string().check(
      minLength(1, "TEAM_YEARLY_PLAN is required"),
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
    INTEGRATION_ENCRYPTION_KEY: optional(string()),
    ZOOM_CLIENT_ID: optional(string()),
    ZOOM_CLIENT_SECRET: optional(string()),
    ZOOM_WEBHOOK_SECRET_TOKEN: optional(string()),
    MICROSOFT_CLIENT_ID: optional(string()),
    MICROSOFT_CLIENT_SECRET: optional(string()),
    GOOGLE_WEBHOOK_SECRET: optional(string()),
  },
  client: {
    NEXT_PUBLIC_APP_BASE_URL: string().check(
      minLength(1, "NEXT_PUBLIC_APP_BASE_URL is required"),
    ),
    NEXT_PUBLIC_APP_SERVER_URL: string().check(
      minLength(1, "NEXT_PUBLIC_APP_SERVER_URL is required"),
    ),
  },
  shared: {},
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL,
    NEXT_PUBLIC_APP_SERVER_URL: process.env.NEXT_PUBLIC_APP_SERVER_URL,
  },
});

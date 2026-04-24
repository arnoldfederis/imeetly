import { createEnv } from "@t3-oss/env-nextjs";
import { minLength, optional, string } from "zod/mini";

export const env = createEnv({
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  server: {
    APP_ENV: string().check(minLength(1, "APP_ENV is required")),
    DATABASE_URL: string().check(minLength(1, "DATABASE_URL is required")),

    // Deepgram
    DEEPGRAM_API_KEY: optional(string()),

    // S3 / Object Storage (Cloudflare R2)
    S3_ENDPOINT: string().check(minLength(1, "S3_ENDPOINT is required")),
    S3_ACCESS_KEY_ID: string().check(
      minLength(1, "S3_ACCESS_KEY_ID is required"),
    ),
    S3_SECRET_ACCESS_KEY: string().check(
      minLength(1, "S3_SECRET_ACCESS_KEY is required"),
    ),
    S3_BUCKET: string().check(minLength(1, "S3_BUCKET is required")),
    S3_REGION: string().check(minLength(1, "S3_REGION is required")),

    // Temporal
    TEMPORAL_ADDRESS: string().check(
      minLength(1, "TEMPORAL_ADDRESS is required"),
    ),
    TEMPORAL_NAMESPACE: string().check(
      minLength(1, "TEMPORAL_NAMESPACE is required"),
    ),

    // AI provider keys - all optional so missing keys don't crash startup
    OPENAI_API_KEY: optional(string()),
    ANTHROPIC_API_KEY: optional(string()),
    GROQ_API_KEY: optional(string()),

    // AI provider selection - optional, defaults to "auto"
    AI_TRANSCRIPTION_PROVIDER: optional(string()),
    AI_EXTRACTION_PROVIDER: optional(string()),
    AI_TRANSCRIPTION_FALLBACK: optional(string()),
    AI_EXTRACTION_FALLBACK: optional(string()),
  },
  client: {},
  shared: {},
  experimental__runtimeEnv: {},
});

export const isDevelopment = env.APP_ENV === "development";
export const isProduction = env.APP_ENV === "production";

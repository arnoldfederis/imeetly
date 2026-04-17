import { createEnv } from "@t3-oss/env-nextjs";
import { minLength, string } from "zod";

export const env = createEnv({
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  server: {
    APP_ENV: string().check(minLength(1, "APP_ENV is required")),
    APP_MODULE: string().check(minLength(1, "APP_MODULE is required")),
    DATABASE_URL: string().check(minLength(1, "DATABASE_URL is required")),
  },
  client: {},
  shared: {},
  experimental__runtimeEnv: {},
});

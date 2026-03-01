import { createEnv } from "@t3-oss/env-core";
import { minLength, string } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: string().check(minLength(1, "DATABASE_URL is required")),
  },
  runtimeEnv: process.env,
});

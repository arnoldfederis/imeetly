import { env } from "@repo/db/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/generated",
  schema: "./src/schemas/*",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});

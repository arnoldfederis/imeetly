import { env } from "@shared/rpc/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/db/generated",
  schema: "./src/db/schemas/*",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});

import { Pool } from "@neondatabase/serverless";
import { env } from "@repo/db/env";
import { appRelations } from "@repo/db/relations/app";
import { authRelations } from "@repo/db/relations/auth";
import { appSchema } from "@repo/db/schemas/app";
import { authSchema } from "@repo/db/schemas/auth";
import { ConsoleLogWriter, DefaultLogger } from "drizzle-orm/logger";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";

export const schema = {
  ...appSchema,
  ...authSchema,
  ...authRelations,
  ...appRelations,
};

type Schema = typeof schema;

const logger =
  env.APP_ENV === "development" && env.APP_MODULE === "server"
    ? new DefaultLogger({ writer: new ConsoleLogWriter() })
    : undefined;

function createDb(): NeonDatabase<Schema> {
  if (env.APP_ENV === "production") {
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    return drizzleNeon({ client: pool, schema, logger });
  }

  // Development: Bun SQL (native driver, only available in Bun runtime)
  const { SQL } = require("bun");
  const { drizzle: drizzleBun } = require("drizzle-orm/bun-sql");
  const client = new SQL(env.DATABASE_URL);
  return drizzleBun({ client, schema, logger });
}

export const db = createDb();

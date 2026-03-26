import { Pool } from "@neondatabase/serverless";
import { env } from "@repo/db/env";
import { appRelations } from "@repo/db/relations/app";
import { authRelations } from "@repo/db/relations/auth";
import { appSchema } from "@repo/db/schemas/app";
import { authSchema } from "@repo/db/schemas/auth";
import { SQL } from "bun";
import { drizzle as drizzleBun } from "drizzle-orm/bun-sql";
import { ConsoleLogWriter, DefaultLogger } from "drizzle-orm/logger";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";

export const schema = {
  ...appSchema,
  ...authSchema,
  ...authRelations,
  ...appRelations,
};

const logger =
  env.APP_ENV === "development" && env.APP_MODULE === "server"
    ? new DefaultLogger({ writer: new ConsoleLogWriter() })
    : undefined;

const pool = new Pool({ connectionString: env.DATABASE_URL });
const prodDb = drizzleNeon({ client: pool, schema, logger });

const client = new SQL(env.DATABASE_URL);
const devDb = drizzleBun({ client, schema, logger });

export const db = env.APP_ENV === "development" ? devDb : prodDb;

import { env } from "@repo/db/env";
import { appRelations } from "@repo/db/relations/app";
import { authRelations } from "@repo/db/relations/auth";
import { appSchema } from "@repo/db/schemas/app";
import { authSchema } from "@repo/db/schemas/auth";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { ConsoleLogWriter, DefaultLogger } from "drizzle-orm/logger";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

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

// Better Auth's Drizzle adapter relies on relational query APIs exposed on
// `db.query[...]`. The node-postgres driver consistently provides the shape
// needed by auth/session lookups across Bun server runtime and Next SSR.

type Db = NodePgDatabase<typeof schema>;

function createNodePgDb(): Db {
  const { drizzle } =
    require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");
  return drizzle(env.DATABASE_URL, { schema, logger });
}

function createBunSqlDb(): BunSQLDatabase<typeof schema> {
  const { drizzle } =
    require("drizzle-orm/bun-sql") as typeof import("drizzle-orm/bun-sql");
  const { SQL } = require("bun") as typeof import("bun");
  const client = new SQL(env.DATABASE_URL);
  return drizzle({ client, schema, logger });
}

function createDb(): Db {
  if (env.APP_ENV === "development") {
    return createNodePgDb();
  }

  return createBunSqlDb() as unknown as Db;
}

export const db: Db = createDb();

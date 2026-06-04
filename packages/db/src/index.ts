import { env } from "@repo/db/env";
import { appRelations } from "@repo/db/relations/app";
import { authRelations } from "@repo/db/relations/auth";
import { appSchema } from "@repo/db/schemas/app";
import { authSchema } from "@repo/db/schemas/auth";
import { ConsoleLogWriter, DefaultLogger } from "drizzle-orm/logger";
import { drizzle } from "drizzle-orm/node-postgres";

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
export const db = drizzle(env.DATABASE_URL, { schema, logger });

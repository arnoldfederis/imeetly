import { env } from "@repo/db/env";
import { appRelations } from "@repo/db/relations/app";
import { authRelations } from "@repo/db/relations/auth";
import { appSchema } from "@repo/db/schemas/app";
import { authSchema } from "@repo/db/schemas/auth";
import { ConsoleLogWriter, DefaultLogger } from "drizzle-orm/logger";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
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

const prodDb = drizzleNeon(env.DATABASE_URL, { schema, logger });

const devDb = drizzle(env.DATABASE_URL, { schema, logger });

export const db = env.APP_ENV === "development" ? devDb : prodDb;

import { env } from "@repo/db/env";
import { appRelations } from "@repo/db/relations/app";
import { authRelations } from "@repo/db/relations/auth";
import { appSchema } from "@repo/db/schemas/app";
import { authSchema } from "@repo/db/schemas/auth";
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { ConsoleLogWriter, DefaultLogger } from "drizzle-orm/logger";

const client = new SQL(env.DATABASE_URL);

const logger =
  env.APP_ENV === "development" && env.APP_MODULE === "server"
    ? new DefaultLogger({ writer: new ConsoleLogWriter() })
    : undefined;

export const schema = {
  ...appSchema,
  ...authSchema,
  ...authRelations,
  ...appRelations,
};

export const db = drizzle({
  client,
  schema,
  logger,
});

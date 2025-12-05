import { schema } from "@shared/rpc/db/schema";
import { env } from "@shared/rpc/env";
import { ConsoleLogWriter, DefaultLogger } from "drizzle-orm/logger";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-http";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";

const logger =
  env.APP_ENV === "development"
    ? new DefaultLogger({ writer: new ConsoleLogWriter() })
    : undefined;

export const db =
  env.APP_ENV === "development"
    ? pgDrizzle(env.DATABASE_URL, {
        schema,
        logger,
      })
    : neonDrizzle(env.DATABASE_URL, {
        schema,
        logger,
      });

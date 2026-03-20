import { appRelations } from "@repo/db/relations/app";
import { authRelations } from "@repo/db/relations/auth";
import { appSchema } from "@repo/db/schemas/app";
import { authSchema } from "@repo/db/schemas/auth";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env";

const schema = {
  ...appSchema,
  ...authSchema,
  ...authRelations,
  ...appRelations,
};

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle({ client: pool, schema });

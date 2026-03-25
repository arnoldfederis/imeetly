import { Pool as NeonPool } from "@neondatabase/serverless";
import { appRelations } from "@repo/db/relations/app";
import { authRelations } from "@repo/db/relations/auth";
import { appSchema } from "@repo/db/schemas/app";
import { authSchema } from "@repo/db/schemas/auth";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env";

const schema = {
  ...appSchema,
  ...authSchema,
  ...authRelations,
  ...appRelations,
};

function createDb() {
  if (env.APP_ENV === "production") {
    const pool = new NeonPool({ connectionString: env.DATABASE_URL });
    return drizzleNeon({ client: pool, schema });
  }

  // Development: node-postgres (native Node.js driver)
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return drizzleNode({ client: pool, schema });
}

export const db = createDb();

import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { env } from "./env";

const sql = neon(env.DATABASE_URL);
const db = drizzleNeon(sql);

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: "./src/generated" });
    console.log("Migration completed");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
};

main();

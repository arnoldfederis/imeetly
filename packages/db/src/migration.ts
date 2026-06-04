import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { env } from "./env";

const db = drizzle(env.DATABASE_URL);

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

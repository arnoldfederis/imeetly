import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { env } from './env'
import { drizzle as drizzleBun } from "drizzle-orm/bun-sql";

const sql = neon(env.DATABASE_URL);
const client = new SQL(env.DATABASE_URL);
const db = env.APP_ENV === "production" ? drizzleNeon(sql) : drizzleBun({client});

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: './src/generated' });
    console.log('Migration completed');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

main();